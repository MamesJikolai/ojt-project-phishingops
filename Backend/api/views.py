import csv
import os
import io
import logging

from django.contrib.auth import authenticate, get_user_model
from django.db.models import Count, Avg, Q, Max
from django.http import HttpResponse
from django.utils import timezone
from django.utils.timezone import localtime
from rest_framework import status, viewsets, filters
from api.permissions import IsAdminRole, IsAdminOrHRReadOnly
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend

from apps.campaigns.models import (
    EmailTemplate, Campaign, CampaignTarget,
    LessonProgress, QuizAttempt,
)
from apps.campaigns.tasks import launch_campaign_async, _launch_sync
from apps.lms.models import Course, Lesson, Quiz, QuizQuestion, QuizChoice
from .serializers import (
    UserSerializer,
    EmailTemplateSerializer,
    CampaignListSerializer, CampaignDetailSerializer,
    CampaignTargetSerializer, CampaignSMTPSerializer,
    CourseListSerializer, CourseDetailSerializer, CoursePublicSerializer,
    LessonSerializer,
    QuizSerializer, QuizWriteSerializer,
    QuizQuestionSerializer, QuizQuestionWriteSerializer,
    QuizChoiceSerializer,
    LessonSerializer,
    QuizSerializer,
    LessonProgressSerializer, QuizAttemptSerializer,
    AnalyticsSummarySerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════════

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {'error': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {'error': 'This account is disabled.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id':           user.id,
                'username':     user.username,
                'email':        user.email,
                'full_name':    user.get_full_name(),
                'role':         user.role,
                'is_staff':     user.is_staff,
                'is_superuser': user.is_superuser,
            },
        })


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('refresh')
        if not token:
            return Response({'error': 'Refresh token required.'}, status=400)
        try:
            refresh = RefreshToken(token)
            return Response({'access': str(refresh.access_token)})
        except Exception:
            return Response({'error': 'Invalid or expired token.'}, status=401)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh'))
            token.blacklist()
        except Exception:
            pass
        return Response({'detail': 'Logged out.'})


class MeView(APIView):
    # Both admin and HR can GET and PATCH their own profile
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        allowed = ['first_name', 'last_name', 'email']
        for field in allowed:
            if field in request.data:
                setattr(request.user, field, request.data[field])
        request.user.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    # POST /api/v1/auth/change-password/
    # Body: { current_password, new_password, confirm_password }
    # Both admin and HR can change their own password.
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current  = request.data.get('current_password', '').strip()
        new_pw   = request.data.get('new_password', '').strip()
        confirm  = request.data.get('confirm_password', '').strip()

        if not current or not new_pw or not confirm:
            return Response(
                {'error': 'All password fields are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.check_password(current):
            return Response(
                {'error': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if new_pw != confirm:
            return Response(
                {'error': 'New password and confirm password do not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_pw) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.set_password(new_pw)
        request.user.save()
        return Response({'detail': 'Password changed successfully.'})


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

class EmailTemplateViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for email templates.
    GET    /api/v1/templates/        — list all
    POST   /api/v1/templates/        — create
    GET    /api/v1/templates/<id>/   — retrieve
    PATCH  /api/v1/templates/<id>/   — update
    DELETE /api/v1/templates/<id>/   — delete
    """
    queryset           = EmailTemplate.objects.select_related('created_by').all()
    serializer_class   = EmailTemplateSerializer
    permission_classes = [IsAdminOrHRReadOnly]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['name', 'subject', 'company_name', 'sender_name']
    ordering_fields    = ['name', 'created_at']
    ordering           = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


# ═══════════════════════════════════════════════════════════════════════════════
# CAMPAIGNS
# ═══════════════════════════════════════════════════════════════════════════════

class CampaignViewSet(viewsets.ModelViewSet):
    """
    Full CRUD plus launch / pause actions.
    GET    /api/v1/campaigns/                   — list
    POST   /api/v1/campaigns/                   — create
    GET    /api/v1/campaigns/<id>/              — detail
    PATCH  /api/v1/campaigns/<id>/              — update
    DELETE /api/v1/campaigns/<id>/              — delete
    POST   /api/v1/campaigns/<id>/launch/       — launch
    POST   /api/v1/campaigns/<id>/pause/        — pause
    POST   /api/v1/campaigns/<id>/complete/     — mark complete
    """
    permission_classes = [IsAdminOrHRReadOnly]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status']
    search_fields      = ['name', 'description']
    ordering_fields    = ['created_at', 'name', 'status']
    ordering           = ['-created_at']

    def get_queryset(self):
        return Campaign.objects.select_related(
            'email_template', 'assigned_course', 'created_by'
        ).prefetch_related('targets').all()

    def get_serializer_class(self):
        if self.action in ('list',):
            return CampaignListSerializer
        return CampaignDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # ── Custom actions ─────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'])
    def launch(self, request, pk=None):
        campaign = self.get_object()

        if not campaign.targets.exists():
            return Response(
                {'error': 'No targets added. Add targets before launching.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not campaign.email_template:
            return Response(
                {'error': 'No email template assigned. Edit the campaign to assign one.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not campaign.smtp_host or not campaign.smtp_user:
            return Response(
                {'error': 'SMTP configuration incomplete. Edit the campaign to set SMTP details.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if campaign.status == Campaign.STATUS_RUNNING:
            return Response(
                {'error': 'Campaign is already running.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from django_q.tasks import async_task
            async_task(
                'apps.campaigns.tasks.launch_campaign_async',
                campaign.id,
                task_name=f'launch-campaign-{campaign.id}',
            )
        except Exception as e:
            logger.warning(f'Django-Q unavailable ({e}), launching synchronously.')
            try:
                _launch_sync(campaign.id)
            except Exception as sync_err:
                return Response(
                    {'error': f'Launch failed: {str(sync_err)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response({
            'status':  'launched',
            'targets': campaign.targets.count(),
            'unsent':  campaign.targets.filter(email_sent_at__isnull=True).count(),
        })

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        campaign = self.get_object()
        campaign.status = Campaign.STATUS_PAUSED
        campaign.save(update_fields=['status'])
        return Response({'status': 'paused'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        campaign = self.get_object()
        campaign.status       = Campaign.STATUS_COMPLETED
        campaign.completed_at = timezone.now()
        campaign.save(update_fields=['status', 'completed_at'])
        return Response({'status': 'completed'})
    
    @action(
        detail=True,
        methods=['get', 'patch'],
        url_path='smtp',
        permission_classes=[IsAdminUser]
    )
    def smtp(self, request, pk=None):
        campaign = self.get_object()

        if request.method == 'GET':
            serializer = CampaignSMTPSerializer(campaign)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            serializer = CampaignSMTPSerializer(
                campaign,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

            return Response({
                'status': 'smtp configuration updated'
            }, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════════
# CAMPAIGN TARGETS
# ═══════════════════════════════════════════════════════════════════════════════

class CampaignTargetViewSet(viewsets.ModelViewSet):
    """
    Targets nested under campaigns.
    GET    /api/v1/campaigns/<campaign_pk>/targets/            — list
    POST   /api/v1/campaigns/<campaign_pk>/targets/            — add single target
    PATCH  /api/v1/campaigns/<campaign_pk>/targets/<id>/       — edit target
    DELETE /api/v1/campaigns/<campaign_pk>/targets/<id>/       — remove target
    POST   /api/v1/campaigns/<campaign_pk>/targets/upload_csv/ — bulk CSV upload
    """
    serializer_class   = CampaignTargetSerializer
    permission_classes = [IsAdminOrHRReadOnly]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['email', 'full_name', 'department']
    http_method_names  = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return CampaignTarget.objects.filter(
            campaign_id=self.kwargs['campaign_pk']
        ).select_related('campaign')

    def perform_create(self, serializer):
        campaign = Campaign.objects.get(pk=self.kwargs['campaign_pk'])
        serializer.save(campaign=campaign)

    @action(detail=False, methods=['post'], url_path='upload_csv')
    def upload_csv(self, request, campaign_pk=None):
        campaign = Campaign.objects.get(pk=campaign_pk)
        csv_file = request.FILES.get('csv_file')

        if not csv_file:
            return Response({'error': 'No file provided.'}, status=400)
        if not csv_file.name.endswith('.csv'):
            return Response({'error': 'Only .csv files are accepted.'}, status=400)

        decoded = csv_file.read().decode('utf-8')
        reader  = csv.DictReader(io.StringIO(decoded))

        created, skipped = 0, 0
        for row in reader:
            email = row.get('email', '').strip().lower()
            if not email:
                continue
            _, was_created = CampaignTarget.objects.get_or_create(
                campaign=campaign,
                email=email,
                defaults={
                    'full_name':  row.get('full_name',  '').strip(),
                    'department': row.get('department', '').strip(),
                    'position':   row.get('position',   '').strip(),
                },
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        return Response({'created': created, 'skipped': skipped})


# ── Flat view: all targets across all campaigns (for user management page) ─────

class AllTargetsView(APIView):
    permission_classes = [IsAdminOrHRReadOnly]

    def get(self, request):
        qs = CampaignTarget.objects.select_related('campaign').order_by(
            '-campaign__created_at'
        )
        search = request.query_params.get('q', '').strip()
        campaign_id = request.query_params.get('campaign')
        status_f    = request.query_params.get('status')

        if search:
            qs = qs.filter(
                Q(email__icontains=search) | Q(full_name__icontains=search) |
                Q(department__icontains=search)
            )
        if campaign_id:
            qs = qs.filter(campaign_id=campaign_id)
        if status_f == 'clicked':
            qs = qs.filter(link_clicked_at__isnull=False)
        elif status_f == 'not_clicked':
            qs = qs.filter(link_clicked_at__isnull=True, email_sent_at__isnull=False)
        elif status_f == 'completed':
            qs = qs.filter(lms_completed_at__isnull=False)
        elif status_f == 'in_progress':
            qs = qs.filter(lms_started_at__isnull=False, lms_completed_at__isnull=True)
        elif status_f == 'failed':
            qs = qs.filter(email_failed=True)

        serializer = CampaignTargetSerializer(qs, many=True)
        return Response(serializer.data)


# ═══════════════════════════════════════════════════════════════════════════════
# COURSES (Admin-facing)
# ═══════════════════════════════════════════════════════════════════════════════

class CourseViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/courses/        — list all (staff sees all, others see published only)
    POST   /api/v1/courses/        — create (staff only)
    GET    /api/v1/courses/<id>/   — detail
    PATCH  /api/v1/courses/<id>/   — update (staff only)
    DELETE /api/v1/courses/<id>/   — delete (staff only)
    """
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields   = ['title', 'description']
    ordering_fields = ['title', 'created_at']
    ordering        = ['-created_at']

    def get_permissions(self):
        # Write actions — admin only
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminRole()]
        # Read actions — allow anyone (unauthenticated users see published only)
        return [AllowAny()]

    def get_queryset(self):
        # Authenticated staff/admin → see all courses
        if self.request.user and self.request.user.is_authenticated and self.request.user.is_staff:
            return Course.objects.prefetch_related('lessons', 'quiz__questions__choices').all()
        # Everyone else (unauthenticated employees, HR) → published only
        return Course.objects.filter(is_published=True).prefetch_related(
            'lessons', 'quiz__questions__choices'
        )

    def get_serializer_class(self):
        # # Unauthenticated users (employees from phishing links) get the
        # # public serializer which excludes is_published and admin fields
        # is_authenticated = (
        #     self.request.user and
        #     self.request.user.is_authenticated
        # )
        # if not is_authenticated:
        #     return CoursePublicSerializer
        if self.action == 'list':
            return CourseListSerializer
        return CourseDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(
        detail=True,
        methods=['post'],
        url_path='upload-thumbnail',
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_thumbnail(self, request, pk=None):
        course = self.get_object()
        thumbnail = request.FILES.get('thumbnail')

        if not thumbnail:
            return Response(
                {'error': 'No thumbnail file provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate extension
        valid_extensions = ['.jpg', '.jpeg', '.png', '.webp']
        ext = os.path.splitext(thumbnail.name)[1].lower()

        if ext not in valid_extensions:
            return Response(
                {'error': 'Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate MIME type
        valid_mime_types = ['image/jpeg', 'image/png', 'image/webp']
        if thumbnail.content_type not in valid_mime_types:
            return Response(
                {'error': 'Invalid file content type.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save
        course.thumbnail = thumbnail
        course.save(update_fields=['thumbnail'])

        return Response(
            {
                'detail': 'Thumbnail uploaded successfully.',
                'course_id': course.id,
                'thumbnail': course.thumbnail.name,
            },
            status=status.HTTP_200_OK,
        )


# ── Lesson ViewSet ────────────────────────────────────────────────────────────

class LessonViewSet(viewsets.ModelViewSet):
    """
    CRUD for lessons nested under courses.
    GET    /api/v1/courses/<course_pk>/lessons/          — list lessons
    POST   /api/v1/courses/<course_pk>/lessons/          — add lesson (admin only)
    GET    /api/v1/courses/<course_pk>/lessons/<id>/     — retrieve
    PATCH  /api/v1/courses/<course_pk>/lessons/<id>/     — update (admin only)
    DELETE /api/v1/courses/<course_pk>/lessons/<id>/     — delete (admin only)
    """
    serializer_class   = LessonSerializer
    filter_backends    = [filters.OrderingFilter]
    ordering_fields    = ['order', 'title']
    ordering           = ['order']
    http_method_names  = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminRole()]
        return [AllowAny()]

    def get_queryset(self):
        return Lesson.objects.filter(course_id=self.kwargs['course_pk'])

    def perform_create(self, serializer):
        course = Course.objects.get(pk=self.kwargs['course_pk'])
        serializer.save(course=course)


# ── Quiz ViewSet ──────────────────────────────────────────────────────────────

class QuizViewSet(viewsets.ModelViewSet):
    """
    CRUD for quizzes — one quiz per course.

    GET    /api/v1/courses/<course_pk>/quiz/       — get the quiz for a course
    POST   /api/v1/courses/<course_pk>/quiz/       — create quiz (admin only)
    PATCH  /api/v1/courses/<course_pk>/quiz/<id>/  — update quiz (admin only)
    DELETE /api/v1/courses/<course_pk>/quiz/<id>/  — delete quiz (admin only)
    """
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminRole()]
        return [AllowAny()]

    def get_queryset(self):
        return Quiz.objects.filter(
            course_id=self.kwargs['course_pk']
        ).prefetch_related('questions__choices')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return QuizWriteSerializer
        return QuizSerializer

    def perform_create(self, serializer):
        course = Course.objects.get(pk=self.kwargs['course_pk'])
        serializer.save(course=course)


# ── QuizQuestion ViewSet ───────────────────────────────────────────────────────

class QuizQuestionViewSet(viewsets.ModelViewSet):
    """
    CRUD for questions nested under a quiz.

    GET    /api/v1/quizzes/<quiz_pk>/questions/          — list questions
    POST   /api/v1/quizzes/<quiz_pk>/questions/          — add question (admin only)
    GET    /api/v1/quizzes/<quiz_pk>/questions/<id>/     — retrieve question
    PATCH  /api/v1/quizzes/<quiz_pk>/questions/<id>/     — update (admin only)
    DELETE /api/v1/quizzes/<quiz_pk>/questions/<id>/     — delete (admin only)
    """
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminRole()]
        return [IsAdminOrHRReadOnly()]

    def get_queryset(self):
        return QuizQuestion.objects.filter(
            quiz_id=self.kwargs['quiz_pk']
        ).prefetch_related('choices').order_by('order')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return QuizQuestionWriteSerializer
        return QuizQuestionSerializer

    def perform_create(self, serializer):
        quiz = Quiz.objects.get(pk=self.kwargs['quiz_pk'])
        serializer.save(quiz=quiz)


# ── QuizChoice ViewSet ─────────────────────────────────────────────────────────

class QuizChoiceViewSet(viewsets.ModelViewSet):
    """
    CRUD for choices nested under a question.

    GET    /api/v1/questions/<question_pk>/choices/          — list choices
    POST   /api/v1/questions/<question_pk>/choices/          — add choice (admin only)
    GET    /api/v1/questions/<question_pk>/choices/<id>/     — retrieve
    PATCH  /api/v1/questions/<question_pk>/choices/<id>/     — update (admin only)
    DELETE /api/v1/questions/<question_pk>/choices/<id>/     — delete (admin only)
    """
    serializer_class  = QuizChoiceSerializer
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminRole()]
        return [IsAdminOrHRReadOnly()]

    def get_queryset(self):
        return QuizChoice.objects.filter(
            question_id=self.kwargs['question_pk']
        ).order_by('order')

    def perform_create(self, serializer):
        question = QuizQuestion.objects.get(pk=self.kwargs['question_pk'])
        serializer.save(question=question)


# ═══════════════════════════════════════════════════════════════════════════════
# LMS — Employee-facing (no login, token-gated)
# ═══════════════════════════════════════════════════════════════════════════════

class LMSSessionView(APIView):
    """
    POST /api/v1/lms/session/
    Body: { "token": "<uuid>", "course_id": <int> (optional) }

    Called by React when an employee starts or resumes a course.

    Without course_id  — returns the target info and list of all available
                         published courses so the frontend can show a course picker.
    With course_id     — returns full course content + this employee's progress
                         in that specific course.

    Progress is tracked per (target, lesson) and (target, quiz) regardless of
    which campaign sent the employee — removing assigned_course from campaigns
    does not break progress tracking.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        token     = request.data.get('token')
        course_id = request.data.get('course_id')

        if not token:
            return Response({'error': 'Token is required.'}, status=400)

        try:
            target = CampaignTarget.objects.select_related('campaign').get(token=token)
        except CampaignTarget.DoesNotExist:
            return Response({'error': 'Invalid or expired link.'}, status=404)

        if not target.link_clicked_at:
            return Response({'error': 'Invalid or expired link.'}, status=404)

        # Record first LMS access
        if not target.lms_started_at:
            target.lms_started_at = timezone.now()
            target.save(update_fields=['lms_started_at'])

        target_name = target.full_name or target.email.split('@')[0]

        # ── No course_id — return course list for the picker ──────────────────
        if not course_id:
            courses = Course.objects.filter(is_published=True).prefetch_related(
                'lessons'
            )
            return Response({
                'target_id':   target.id,
                'target_name': target_name,
                'campaign_name': target.campaign.name,
                'course':      None,
                'courses':     CoursePublicSerializer(
                                   courses, many=True, context={'request': request}
                               ).data,
                'message':     'Please select a course to begin your training.',
            })

        # ── With course_id — load course + progress ───────────────────────────
        try:
            course = Course.objects.prefetch_related(
                'lessons', 'quiz__questions__choices'
            ).get(id=course_id, is_published=True)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found or not available.'}, status=404)

        # Per-lesson progress for this employee in this course
        progress_qs  = LessonProgress.objects.filter(
            target=target, lesson__course=course
        )
        progress_map = {lp.lesson_id: lp for lp in progress_qs}

        lessons_data = []
        for lesson in course.lessons.all():
            lp = progress_map.get(lesson.id)
            lessons_data.append({
                'id':               lesson.id,
                'title':            lesson.title,
                'description':      lesson.description,
                'video_source':     lesson.video_source,
                'content_html':     lesson.content_html,
                'order':            lesson.order,
                'duration_minutes': lesson.duration_minutes,
                'completed':        lp.is_completed if lp else False,
            })

        completed_lessons = sum(1 for l in lessons_data if l['completed'])
        total_lessons     = len(lessons_data)
        all_lessons_done  = total_lessons > 0 and completed_lessons >= total_lessons

        # Best quiz attempt for this employee in this course
        quiz_attempt = QuizAttempt.objects.filter(
            target=target, quiz__course=course
        ).order_by('-submitted_at').first()

        # Mark lms_completed_at when all lessons done AND quiz passed
        if all_lessons_done and quiz_attempt and quiz_attempt.passed:
            if not target.lms_completed_at:
                target.lms_completed_at = timezone.now()
                # Store average of best scores across all quizzes
                from django.db.models import Max
                best_scores = list(
                    QuizAttempt.objects
                    .filter(target=target)
                    .values('quiz')
                    .annotate(best=Max('score'))
                    .values_list('best', flat=True)
                )
                target.quiz_score = round(
                    sum(best_scores) / len(best_scores), 1
                ) if best_scores else quiz_attempt.score
                target.save(update_fields=['lms_completed_at', 'quiz_score'])

        return Response({
            'target_id':     target.id,
            'target_name':   target_name,
            'campaign_name': target.campaign.name,
            'course': CoursePublicSerializer(course, context={'request': request}).data,
            'lessons':       lessons_data,
            'progress': {
                'completed_lessons': completed_lessons,
                'total_lessons':     total_lessons,
                'all_complete':      all_lessons_done,
                'lms_completed':     target.lms_completed_at is not None,
            },
            'quiz_attempt': {
                'score':  quiz_attempt.score,
                'passed': quiz_attempt.passed,
            } if quiz_attempt else None,
        })


class LMSCompleteLessonView(APIView):
    """
    GET  /api/v1/lms/lessons/<lesson_id>/complete/?token=<uuid>
         Returns whether this lesson is already completed for this employee.
         Used on page load to restore state without re-watching.

    POST /api/v1/lms/lessons/<lesson_id>/complete/
         Body: { "token": "<uuid>" }
         Marks a lesson as completed (idempotent — safe to call multiple times).
    """
    permission_classes = [AllowAny]

    def _get_target_and_lesson(self, token, lesson_id):
        """Shared lookup used by both GET and POST."""
        if not token:
            return None, None, Response({'error': 'Token is required.'}, status=400)
        try:
            target = CampaignTarget.objects.get(token=token)
        except CampaignTarget.DoesNotExist:
            return None, None, Response({'error': 'Invalid token.'}, status=404)
        try:
            lesson = Lesson.objects.select_related('course').get(id=lesson_id)
        except Lesson.DoesNotExist:
            return None, None, Response({'error': 'Lesson not found.'}, status=404)
        return target, lesson, None

    def get(self, request, lesson_id):
        """
        Check completion status for a single lesson.
        Frontend calls this on mount to know if the lesson is already done
        so it can skip requiring the user to re-watch.
        """
        token = request.query_params.get('token')
        target, lesson, err = self._get_target_and_lesson(token, lesson_id)
        if err:
            return err

        progress = LessonProgress.objects.filter(
            target=target, lesson=lesson
        ).first()

        course    = lesson.course
        total     = course.lessons.count()
        completed = LessonProgress.objects.filter(
            target=target, lesson__course=course, completed_at__isnull=False
        ).count()

        return Response({
            'lesson_id':          lesson.id,
            'completed':          progress.is_completed if progress else False,
            'completed_at':       progress.completed_at if progress else None,
            'all_lessons_done':   total > 0 and completed >= total,
            'completed_lessons':  completed,
            'total_lessons':      total,
        })

    def post(self, request, lesson_id):
        """
        Mark a lesson as completed. Idempotent — calling again on an already
        completed lesson returns the same response without duplicating records.
        """
        token = request.data.get('token')
        target, lesson, err = self._get_target_and_lesson(token, lesson_id)
        if err:
            return err

        progress, _ = LessonProgress.objects.get_or_create(
            target=target, lesson=lesson
        )
        if not progress.completed_at:
            progress.completed_at = timezone.now()
            progress.save(update_fields=['completed_at'])

        course    = lesson.course
        total     = course.lessons.count()
        completed = LessonProgress.objects.filter(
            target=target, lesson__course=course, completed_at__isnull=False
        ).count()
        all_done  = total > 0 and completed >= total

        return Response({
            'completed':          True,
            'all_lessons_done':   all_done,
            'completed_lessons':  completed,
            'total_lessons':      total,
        })


class LMSSubmitQuizView(APIView):
    """
    GET  /api/v1/lms/quiz/<quiz_id>/submit/?token=<uuid>
         Returns the most recent quiz attempt for this employee.
         Used on page load to restore score, pass/fail, and per-question results
         so the user sees their previous result when they return.

    POST /api/v1/lms/quiz/<quiz_id>/submit/
         Body: { "token": "<uuid>", "answers": { "<question_id>": [<choice_id>] } }
         Scores and saves a new quiz attempt.
    """
    permission_classes = [AllowAny]

    def get(self, request, quiz_id):
        """
        Retrieve the most recent quiz attempt for this employee.
        Returns null quiz_attempt if they haven't attempted yet.
        """
        token = request.query_params.get('token')
        if not token:
            return Response({'error': 'Token is required.'}, status=400)

        try:
            target = CampaignTarget.objects.get(token=token)
        except CampaignTarget.DoesNotExist:
            return Response({'error': 'Invalid token.'}, status=404)

        try:
            quiz = Quiz.objects.prefetch_related('questions__choices').get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found.'}, status=404)

        attempt = QuizAttempt.objects.filter(
            target=target, quiz=quiz
        ).order_by('-submitted_at').first()

        attempts_count = QuizAttempt.objects.filter(
            target=target, quiz=quiz
        ).count()

        # Check retake eligibility
        settings_obj = PlatformSettings.get()
        allow_retake = settings_obj.allow_quiz_retake
        max_attempts = quiz.max_attempts  # 0 = unlimited

        can_retake = (
            allow_retake and
            (max_attempts == 0 or attempts_count < max_attempts)
        )

        if not attempt:
            return Response({
                'quiz_id':       quiz.id,
                'quiz_title':    quiz.title,
                'passing_score': quiz.passing_score,
                'max_attempts':  max_attempts,
                'attempts_used': attempts_count,
                'can_retake':    can_retake,
                'quiz_attempt':  None,
            })

        # Re-build per-question results from the stored answers
        saved_answers = attempt.answers or {}
        results = []
        for question in quiz.questions.prefetch_related('choices').all():
            submitted_ids = [
                int(x) for x in saved_answers.get(str(question.id), [])
                if str(x).isdigit()
            ]
            correct_ids = list(
                question.choices.filter(is_correct=True).values_list('id', flat=True)
            )
            results.append({
                'question_id':   question.id,
                'question_text': question.text,
                'explanation':   question.explanation,
                'submitted':     submitted_ids,
                'correct':       correct_ids,
                'is_correct':    set(submitted_ids) == set(correct_ids),
                'choices': [
                    {'id': c.id, 'text': c.text, 'is_correct': c.is_correct}
                    for c in question.choices.all()
                ],
            })

        return Response({
            'quiz_id':       quiz.id,
            'quiz_title':    quiz.title,
            'passing_score': quiz.passing_score,
            'max_attempts':  max_attempts,
            'attempts_used': attempts_count,
            'can_retake':    can_retake,
            'quiz_attempt': {
                'attempt_id':   attempt.id,
                'score':        attempt.score,
                'passed':       attempt.passed,
                'submitted_at': attempt.submitted_at,
                'results':      results,
            },
        })

    def post(self, request, quiz_id):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required.'}, status=400)

        try:
            target = CampaignTarget.objects.select_related('campaign').get(token=token)
        except CampaignTarget.DoesNotExist:
            return Response({'error': 'Invalid token.'}, status=404)

        try:
            quiz = Quiz.objects.prefetch_related('questions__choices').get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found.'}, status=404)

        # ── Check retake eligibility before accepting submission ─────────
        from apps.settings_app.models import PlatformSettings
        settings_obj  = PlatformSettings.get()
        allow_retake  = settings_obj.allow_quiz_retake
        max_attempts  = quiz.max_attempts  # 0 = unlimited
        attempts_used = QuizAttempt.objects.filter(
            target=target, quiz=quiz
        ).count()

        # Block if already passed (regardless of retake setting)
        already_passed = QuizAttempt.objects.filter(
            target=target, quiz=quiz, passed=True
        ).exists()
        if already_passed:
            return Response({
                'error':        'You have already passed this quiz.',
                'attempts_used': attempts_used,
                'can_retake':   False,
            }, status=400)

        # Block if retakes are globally disabled and they've already attempted
        if not allow_retake and attempts_used > 0:
            return Response({
                'error':        'Quiz retakes are not allowed.',
                'attempts_used': attempts_used,
                'can_retake':   False,
            }, status=400)

        # Block if max_attempts reached (0 = unlimited)
        if max_attempts > 0 and attempts_used >= max_attempts:
            return Response({
                'error':        f'Maximum attempts ({max_attempts}) reached.',
                'attempts_used': attempts_used,
                'max_attempts':  max_attempts,
                'can_retake':   False,
            }, status=400)

        answers  = request.data.get('answers', {})
        questions = quiz.questions.prefetch_related('choices').all()

        correct_count = 0
        for question in questions:
            submitted = set(
                int(x) for x in answers.get(str(question.id), [])
                if str(x).isdigit()
            )
            correct = set(
                question.choices.filter(is_correct=True).values_list('id', flat=True)
            )
            if submitted == correct:
                correct_count += 1

        total  = questions.count()
        score  = round(correct_count / total * 100, 1) if total else 0
        passed = score >= quiz.passing_score

        attempt = QuizAttempt.objects.create(
            target=target,
            quiz=quiz,
            score=score,
            passed=passed,
            answers={str(k): v for k, v in answers.items()},
        )

        # Update target quiz_score with the average of best scores
        # across all quizzes this target has attempted.
        # This handles multiple courses/quizzes correctly.
        from django.db.models import Max
        best_scores = (
            QuizAttempt.objects
            .filter(target=target)
            .values('quiz')
            .annotate(best=Max('score'))
            .values_list('best', flat=True)
        )
        if best_scores:
            target.quiz_score = round(
                sum(best_scores) / len(best_scores), 1
            )
        else:
            target.quiz_score = score

        if passed and not target.lms_completed_at:
            target.lms_completed_at = timezone.now()
        target.save(update_fields=['quiz_score', 'lms_completed_at'])

        # Build per-question result for the frontend
        results = []
        for question in questions:
            submitted_ids = [
                int(x) for x in answers.get(str(question.id), [])
                if str(x).isdigit()
            ]
            correct_ids = list(
                question.choices.filter(is_correct=True).values_list('id', flat=True)
            )
            results.append({
                'question_id':   question.id,
                'question_text': question.text,
                'explanation':   question.explanation,
                'submitted':     submitted_ids,
                'correct':       correct_ids,
                'is_correct':    set(submitted_ids) == set(correct_ids),
                'choices': [
                    {'id': c.id, 'text': c.text, 'is_correct': c.is_correct}
                    for c in question.choices.all()
                ],
            })

        new_attempts_used = attempts_used + 1
        can_retake_after  = (
            not passed and
            allow_retake and
            (max_attempts == 0 or new_attempts_used < max_attempts)
        )

        return Response({
            'attempt_id':    attempt.id,
            'score':         score,
            'passed':        passed,
            'passing_score': quiz.passing_score,
            'attempts_used': new_attempts_used,
            'max_attempts':  max_attempts,
            'can_retake':    can_retake_after,
            'results':       results,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════

class DashboardView(APIView):
    permission_classes = [IsAdminOrHRReadOnly]

    def get(self, request):
        total_targets  = CampaignTarget.objects.count()
        total_sent     = CampaignTarget.objects.filter(email_sent_at__isnull=False).count()
        total_clicked  = CampaignTarget.objects.filter(link_clicked_at__isnull=False).count()
        total_completed = CampaignTarget.objects.filter(lms_completed_at__isnull=False).count()
        # Average of each target's BEST score per quiz
        # Step 1: for each (target, quiz) pair, get the max score
        # Step 2: average those max scores
        from django.db.models import Max, OuterRef, Subquery
        best_per_target_quiz = (
            QuizAttempt.objects
            .values('target', 'quiz')
            .annotate(best=Max('score'))
            .values('best')
        )
        avg_score = best_per_target_quiz.aggregate(
            a=Avg('best')
        )['a'] or 0.0

        recent_campaigns = Campaign.objects.order_by('-created_at')[:5]
        recent_clicks    = CampaignTarget.objects.filter(
            link_clicked_at__isnull=False
        ).select_related('campaign').order_by('-link_clicked_at')[:10]

        return Response({
            'stats': {
                'total_campaigns':  Campaign.objects.count(),
                'running_campaigns': Campaign.objects.filter(status='running').count(),
                'total_targets':    total_targets,
                'total_sent':       total_sent,
                'total_clicked':    total_clicked,
                'total_completed':  total_completed,
                'click_rate':       round(total_clicked / total_sent * 100, 1) if total_sent else 0,
                'completion_rate':  round(total_completed / total_clicked * 100, 1) if total_clicked else 0,
                'avg_quiz_score':   round(avg_score, 1),
            },
            'recent_campaigns': CampaignListSerializer(recent_campaigns, many=True).data,
            'recent_clicks': [
                {
                    'email':      t.email,
                    'full_name':  t.full_name,
                    'campaign':   t.campaign.name,
                    'clicked_at': t.link_clicked_at,
                }
                for t in recent_clicks
            ],
        })


class AnalyticsView(APIView):
    permission_classes = [IsAdminOrHRReadOnly]

    def get(self, request):
        total_sent    = CampaignTarget.objects.filter(email_sent_at__isnull=False).count()
        total_clicked = CampaignTarget.objects.filter(link_clicked_at__isnull=False).count()
        total_completed = CampaignTarget.objects.filter(lms_completed_at__isnull=False).count()

        # Average of best score per (target, quiz) — same logic as dashboard
        best_per_target_quiz = (
            QuizAttempt.objects
            .values('target', 'quiz')
            .annotate(best=Max('score'))
            .values('best')
        )
        avg_score = best_per_target_quiz.aggregate(
            a=Avg('best')
        )['a'] or 0.0

        campaigns = Campaign.objects.annotate(
            sent_count=Count('targets', filter=Q(targets__email_sent_at__isnull=False)),
            click_count=Count('targets', filter=Q(targets__link_clicked_at__isnull=False)),
            complete_count=Count('targets', filter=Q(targets__lms_completed_at__isnull=False)),
        ).order_by('-created_at')

        dept_stats = (
            CampaignTarget.objects
            .exclude(department='')
            .values('department')
            .annotate(
                total=Count('id'),
                clicked=Count('id', filter=Q(link_clicked_at__isnull=False)),
                completed=Count('id', filter=Q(lms_completed_at__isnull=False)),
            )
            .order_by('-clicked')[:10]
        )

        campaigns_data = []
        for c in campaigns:
            campaigns_data.append({
                'id':             c.id,
                'name':           c.name,
                'status':         c.status,
                'sent_count':     c.sent_count,
                'click_count':    c.click_count,
                'complete_count': c.complete_count,
                'click_rate':     round(c.click_count / c.sent_count * 100, 1) if c.sent_count else 0,
                'created_at':     c.created_at,
            })

        return Response({
            'summary': {
                'total_campaigns':  Campaign.objects.count(),
                'total_sent':       total_sent,
                'total_clicked':    total_clicked,
                'total_completed':  total_completed,
                'click_rate':       round(total_clicked / total_sent * 100, 1) if total_sent else 0,
                'completion_rate':  round(total_completed / total_clicked * 100, 1) if total_clicked else 0,
                'avg_quiz_score':   round(avg_score, 1),
            },
            'campaigns':       campaigns_data,
            'department_stats': list(dept_stats),
        })


class ExportCampaignCSVView(APIView):
    permission_classes = [IsAdminOrHRReadOnly]

    def get(self, request, campaign_pk):
        try:
            campaign = Campaign.objects.get(pk=campaign_pk)
        except Campaign.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = (
            f'attachment; filename="{campaign.name}_report.csv"'
        )
        writer = csv.writer(response)
        writer.writerow([
            'Full Name', 'Email', 'Department', 'Position',
            'Email Sent', 'Email Failed', 'Link Clicked',
            'LMS Started', 'LMS Completed', 'Quiz Score',
        ])
        for t in campaign.targets.order_by('full_name'):
            writer.writerow([
                t.full_name, t.email, t.department, t.position,
                localtime(t.email_sent_at).strftime('%Y-%m-%d %H:%M') if t.email_sent_at else '',
                'Yes' if t.email_failed else 'No',
                localtime(t.link_clicked_at).strftime('%Y-%m-%d %H:%M') if t.link_clicked_at else '',
                localtime(t.lms_started_at).strftime('%Y-%m-%d %H:%M') if t.lms_started_at else '',
                localtime(t.lms_completed_at).strftime('%Y-%m-%d %H:%M') if t.lms_completed_at else '',
                f'{t.quiz_score:.1f}%' if t.quiz_score is not None else '',
            ])
        return response


class ExportAllCSVView(APIView):
    permission_classes = [IsAdminOrHRReadOnly]

    def get(self, request):
        targets = CampaignTarget.objects.select_related('campaign').order_by(
            'campaign__name', 'full_name'
        )
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="all_targets.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'Campaign', 'Full Name', 'Email', 'Department', 'Position',
            'Email Sent', 'Email Failed', 'Link Clicked',
            'LMS Started', 'LMS Completed', 'Quiz Score',
        ])
        for t in targets:
            writer.writerow([
                t.campaign.name,
                t.full_name, t.email, t.department, t.position,
                localtime(t.email_sent_at).strftime('%Y-%m-%d %H:%M') if t.email_sent_at else '',
                'Yes' if t.email_failed else 'No',
                localtime(t.link_clicked_at).strftime('%Y-%m-%d %H:%M') if t.link_clicked_at else '',
                localtime(t.lms_started_at).strftime('%Y-%m-%d %H:%M') if t.lms_started_at else '',
                localtime(t.lms_completed_at).strftime('%Y-%m-%d %H:%M') if t.lms_completed_at else '',
                f'{t.quiz_score:.1f}%' if t.quiz_score is not None else '',
            ])
        return response


# ── Quiz attempt results (for analytics page) ─────────────────────────────────
class QuizAttemptsView(APIView):
    permission_classes = [IsAdminOrHRReadOnly]

    def get(self, request):
        qs = QuizAttempt.objects.select_related(
            'target', 'target__campaign', 'quiz__course'
        ).order_by('-submitted_at')

        campaign_id = request.query_params.get('campaign')
        if campaign_id:
            qs = qs.filter(target__campaign_id=campaign_id)

        return Response(QuizAttemptSerializer(qs, many=True).data)


# ═══════════════════════════════════════════════════════════════════════════════
# PLATFORM SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════

from apps.settings_app.models import PlatformSettings
from .serializers import PlatformSettingsSerializer, SMTPTestSerializer
from django.core.mail import EmailMessage
from django.core.mail.backends.smtp import EmailBackend as SMTPBackend


class PlatformSettingsView(APIView):
    """
    GET   /api/v1/settings/  — public, no auth needed (used by phishing landing page)
    PATCH /api/v1/settings/  — admin only
    """
    permission_classes = []   # handled per-method below

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminOrHRReadOnly()]

    def get(self, request):
        settings_obj = PlatformSettings.get()
        return Response(
            PlatformSettingsSerializer(settings_obj, context={'request': request}).data
        )

    def patch(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=401)
        if getattr(request.user, 'role', None) != 'admin':
            return Response({'error': 'Only Admin users can change platform settings.'}, status=403)

        settings_obj = PlatformSettings.get()
        serializer   = PlatformSettingsSerializer(data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        d = serializer.validated_data
        updatable = [
            'platform_name', 'platform_base_url', 'frontend_url',
            'default_from_name', 'session_expiry_days', 'allow_quiz_retake',
            'landing_title', 'landing_message1',
            'landing_message2', 'landing_button_text',
        ]
        for field in updatable:
            if field in d:
                setattr(settings_obj, field, d[field])

        if 'logo' in request.FILES:
            settings_obj.logo = request.FILES['logo']

        settings_obj.save()
        return Response(
            PlatformSettingsSerializer(settings_obj, context={'request': request}).data
        )


class SMTPTestView(APIView):
    """
    GET  /api/v1/settings/smtp-test/  — prefill form with last campaign's SMTP config
    POST /api/v1/settings/smtp-test/  — send a test email
    """
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = SMTPTestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        d = serializer.validated_data
        try:
            backend = SMTPBackend(
                host=d['smtp_host'],
                port=d['smtp_port'],
                username=d['smtp_user'],
                password=d['smtp_password'],
                use_tls=d['smtp_use_tls'],
                use_ssl=d['smtp_use_ssl'],
                fail_silently=False,
                timeout=10,
            )
            msg = EmailMessage(
                subject='[PhishingOps] SMTP Test Email',
                body=(
                    'This is a test email from your PhishingOps platform.\n'
                    'If you received this, your SMTP configuration is working correctly.'
                ),
                from_email=d['from_email'],
                to=[d['to_email']],
                connection=backend,
            )
            msg.send()
            return Response({
                'status':  'ok',
                'message': f'Test email sent to {d["to_email"]} successfully.',
            })
        except Exception as e:
            logger.error(f'SMTP test failed: {e}')
            return Response({
                'status':  'error',
                'message': str(e),
            }, status=400)


# ═══════════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT (admin accounts — not campaign targets)
# ═══════════════════════════════════════════════════════════════════════════════

class UserListView(APIView):
    """
    GET  /api/v1/users/      — list all admin/HR accounts
    POST /api/v1/users/      — create a new admin/HR account (admin only)
    """
    permission_classes = [IsAdminOrHRReadOnly]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        if getattr(request.user, 'role', None) != 'admin':
            return Response(
                {'error': 'Only Admin users can create accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        role     = request.data.get('role', 'hr').strip()

        if not username or not password:
            return Response(
                {'error': 'username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if role not in ('admin', 'hr'):
            return Response(
                {'error': 'role must be either "admin" or "hr".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': f'Username "{username}" is already taken.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            username   = username,
            password   = password,
            email      = request.data.get('email', '').strip(),
            first_name = request.data.get('first_name', '').strip(),
            last_name  = request.data.get('last_name', '').strip(),
            role       = role,
            is_staff   = True,   # all app users need staff flag for admin access
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    """
    GET    /api/v1/users/<id>/   — retrieve a single user
    PATCH  /api/v1/users/<id>/   — update user details (admin only)
    DELETE /api/v1/users/<id>/   — delete a user (admin only, cannot delete self)
    """
    permission_classes = [IsAdminOrHRReadOnly]

    def _get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self._get_user(pk)
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        if getattr(request.user, 'role', None) != 'admin':
            return Response(
                {'error': 'Only Admin users can edit accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        user = self._get_user(pk)
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        allowed = ['first_name', 'last_name', 'email', 'role']
        for field in allowed:
            if field in request.data:
                # Validate role value
                if field == 'role' and request.data['role'] not in ('admin', 'hr'):
                    return Response(
                        {'error': 'role must be "admin" or "hr".'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                setattr(user, field, request.data[field])

        # Optional password reset
        new_password = request.data.get('password', '').strip()
        if new_password:
            if len(new_password) < 8:
                return Response(
                    {'error': 'Password must be at least 8 characters.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(new_password)

        user.save()
        return Response(UserSerializer(user).data)

    def delete(self, request, pk):
        if getattr(request.user, 'role', None) != 'admin':
            return Response(
                {'error': 'Only Admin users can delete accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if request.user.pk == int(pk):
            return Response(
                {'error': 'You cannot delete your own account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = self._get_user(pk)
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
