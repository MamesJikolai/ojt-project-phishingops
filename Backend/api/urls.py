from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

# ── DRF Router — auto-generates CRUD URLs ─────────────────────────────────────
router = DefaultRouter()
router.register(r'templates', views.EmailTemplateViewSet, basename='template')
router.register(r'campaigns', views.CampaignViewSet, basename='campaign')
router.register(
    r'campaigns/(?P<campaign_pk>[^/.]+)/targets',
    views.CampaignTargetViewSet,
    basename='campaign-target',
)
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(
    r'courses/(?P<course_pk>[^/.]+)/lessons',
    views.LessonViewSet,
    basename='course-lesson',
)
router.register(
    r'courses/(?P<course_pk>[^/.]+)/quiz',
    views.QuizViewSet,
    basename='course-quiz',
)
router.register(
    r'quizzes/(?P<quiz_pk>[^/.]+)/questions',
    views.QuizQuestionViewSet,
    basename='quiz-question',
)
router.register(
    r'questions/(?P<question_pk>[^/.]+)/choices',
    views.QuizChoiceViewSet,
    basename='question-choice',
)

urlpatterns = [
    # ── Router-generated URLs ──────────────────────────────────────────────────
    # Templates:   GET/POST /templates/   GET/PATCH/DELETE /templates/<id>/
    # Campaigns:   GET/POST /campaigns/   GET/PATCH/DELETE /campaigns/<id>/
    #              POST /campaigns/<id>/launch/
    #              POST /campaigns/<id>/pause/
    #              POST /campaigns/<id>/complete/
    # Targets:     GET/POST /campaigns/<id>/targets/
    #              PATCH/DELETE /campaigns/<id>/targets/<id>/
    #              POST /campaigns/<id>/targets/upload_csv/
    # Courses:     GET/POST /courses/     GET/PATCH/DELETE /courses/<id>/
    path('', include(router.urls)),

    # ── Auth ───────────────────────────────────────────────────────────────────
    path('auth/login/',   views.LoginView.as_view(), name='login'),
    path('auth/refresh/', views.RefreshView.as_view(), name='refresh'),
    path('auth/logout/',  views.LogoutView.as_view(), name='logout'),
    path('auth/me/', views.MeView.as_view(), name='me'),
    path('auth/change-password/', views.ChangePasswordView.as_view(), name='change-password'),

    # ── All targets (user management — across all campaigns) ──────────────────
    path('targets/', views.AllTargetsView.as_view(), name='all-targets'),

    # ── Dashboard ─────────────────────────────────────────────────────────────
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),

    # ── Analytics ─────────────────────────────────────────────────────────────
    path('analytics/', views.AnalyticsView.as_view(), name='analytics'),
    path('analytics/campaigns/<int:campaign_pk>/export/', views.ExportCampaignCSVView.as_view(), name='export-campaign'),
    path('analytics/export/', views.ExportAllCSVView.as_view(), name='export-all'),
    path('analytics/quiz-attempts/', views.QuizAttemptsView.as_view(), name='quiz-attempts'),

    # ── LMS (employee-facing, no login required) ──────────────────────────────
    path('lms/session/', views.LMSSessionView.as_view(), name='lms-session'),
    path('lms/lessons/<int:lesson_id>/complete/', views.LMSCompleteLessonView.as_view(), name='lms-complete-lesson'),
    path('lms/quiz/<int:quiz_id>/submit/', views.LMSSubmitQuizView.as_view(), name='lms-submit-quiz'),

    # ── Platform Settings ──────────────────────────────────────────────────────
    path('settings/', views.PlatformSettingsView.as_view(), name='settings'),
    path('settings/reminder-smtp/', views.ReminderSMTPSettingsView.as_view(), name='reminder-smtp'),
    path('settings/smtp-test/', views.SMTPTestView.as_view(), name='smtp-test'),
    path('settings/upload-logo/', views.PlatformLogoUploadView.as_view(), name='landing-page-logo'),

    # ── User Management (admin/HR accounts) ───────────────────────────────────
    path('users/', views.UserListView.as_view(),   name='user-list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user-detail'),
]
