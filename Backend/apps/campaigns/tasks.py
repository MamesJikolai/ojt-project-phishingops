import logging
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.core.mail.backends.smtp import EmailBackend

logger = logging.getLogger(__name__)


def _is_html(text: str) -> bool:
    """
    Returns True if the text contains HTML tags.
    Used to decide whether to convert plain text newlines to <br>.
    """
    import re
    return bool(re.search(r'<[a-zA-Z][^>]*>', text))


def _convert_markdown_links(text: str) -> str:
    """
    Convert Markdown-style links [text](url) to HTML <a> tags.
    This runs AFTER html.escape(), so the brackets [ ] ( ) are
    still plain characters — we match them literally.

    Example:
        [here]({{ phishing_link }})
        -> <a href="...">here</a>

    Note: {{ phishing_link }} is substituted BEFORE this function
    is called, so by the time we run, the URL is already the real link.
    """
    import re
    # Match [link text](url) — url can contain any non-whitespace chars
    pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
    replacement = r'<a href="\2" style="color:#1a73e8;">\1</a>'
    return re.sub(pattern, replacement, text)


def _plain_to_html(text: str) -> str:
    """
    Convert plain text to basic HTML preserving newlines.

    Supported formatting (Markdown-lite):
        Single newline       -> <br>
        Double newline       -> new paragraph <p>
        [link text](url)     -> <a href="url">link text</a>

    Example input:
        Dear {{ target_name }},

        Please verify your account by clicking [here]({{ phishing_link }}).

        Regards,
        IT Team

    Example output (rendered in email):
        Dear John,

        Please verify your account by clicking here.  (where "here" is a link)

        Regards,
        IT Team
    """
    import html as html_module
    # Step 1 — escape HTML special chars so < > & display literally
    escaped   = html_module.escape(text)
    # Step 2 — convert [text](url) to <a href="url">text</a>
    linked    = _convert_markdown_links(escaped)
    double_nl = '\n\n'
    single_nl = '\n'
    br_tag    = '<br>'
    paragraphs = linked.split(double_nl)
    html_parts = []
    for para in paragraphs:
        para = para.replace(single_nl, br_tag)
        html_parts.append('<p style="margin:0 0 12px 0;">' + para + '</p>')
    body_content = ''.join(html_parts)
    header = (
        '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
        '<body style="font-family:Arial,sans-serif;font-size:14px;'
        'line-height:1.6;color:#333333;margin:0;padding:20px;">'
        '<div style="max-width:600px;margin:0 auto;">'
    )
    footer = '</div></body></html>'
    return header + body_content + footer


def render_body(body_html: str, target, campaign) -> str:
    """
    Replace {{ variable }} placeholders and ensure the result is
    valid HTML for email sending.

    If the template body contains HTML tags it is used as-is (after
    variable substitution). If it is plain text, newlines are
    converted to <br> / <p> tags so the formatting is preserved.
    """
    if campaign.created_by:
        company = campaign.created_by.get_full_name() or campaign.created_by.username
    else:
        company = 'Your Company'

    target_name = target.full_name or target.email.split('@')[0]

    replacements = {
        '{{ target_name }}':       target_name,
        '{{target_name}}':         target_name,
        '{{ target_email }}':      target.email,
        '{{target_email}}':        target.email,
        '{{ target_department }}': target.department or '',
        '{{target_department}}':   target.department or '',
        '{{ phishing_link }}':     target.phishing_link,
        '{{phishing_link}}':       target.phishing_link,
        '{{ company_name }}':      company,
        '{{company_name}}':        company,
        '{{ campaign_name }}':     campaign.name,
        '{{campaign_name}}':       campaign.name,
    }

    body = body_html

    # Handle {{ phishing_link_text:display text }} — renders as a hyperlink
    # e.g. {{ phishing_link_text:click here }} → <a href="...">click here</a>
    import re
    def replace_link_text(match):
        display = match.group(1).strip()
        return '<a href="' + target.phishing_link + '">' + display + '</a>'

    body = re.sub(
        r'\{\{\s*phishing_link_text\s*:\s*(.+?)\s*\}\}',
        replace_link_text,
        body,
    )

    for placeholder, value in replacements.items():
        body = body.replace(placeholder, value)

    # If the admin typed plain text (no HTML tags), convert it to
    # HTML so newlines and paragraphs render correctly in email clients
    if not _is_html(body):
        body = _plain_to_html(body)

    return body


def _send_single_email(target_id: int):
    """
    Core send logic — plain function called by both async and sync paths.
    Returns (success: bool, error: str).
    """
    from apps.campaigns.models import CampaignTarget

    try:
        target = CampaignTarget.objects.select_related(
            'campaign', 'campaign__email_template', 'campaign__created_by'
        ).get(id=target_id)
    except CampaignTarget.DoesNotExist:
        msg = f'CampaignTarget {target_id} not found.'
        logger.error(msg)
        return False, msg

    campaign = target.campaign
    template = campaign.email_template

    if not template:
        msg = f'Campaign {campaign.id} has no email template.'
        logger.error(msg)
        return False, msg

    if not campaign.smtp_host:
        msg = 'SMTP host is not configured on this campaign.'
        target.email_failed = True
        target.email_error  = msg
        target.save(update_fields=['email_failed', 'email_error'])
        return False, msg

    try:
        backend = EmailBackend(
            host=campaign.smtp_host,
            port=campaign.smtp_port,
            username=campaign.smtp_user,
            password=campaign.smtp_password,
            use_tls=campaign.smtp_use_tls,
            use_ssl=campaign.smtp_use_ssl,
            fail_silently=False,
            timeout=15,
        )

        html_body   = render_body(template.body_html, target, campaign)
        from_header = f'{template.sender_name} <{campaign.from_email}>'

        msg = EmailMultiAlternatives(
            subject=template.subject,
            body='Please enable HTML to view this security awareness email.',
            from_email=from_header,
            to=[target.email],
            connection=backend,
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send()

        target.email_sent_at = timezone.now()
        target.email_failed  = False
        target.email_error   = ''
        target.save(update_fields=['email_sent_at', 'email_failed', 'email_error'])
        logger.info(f'Email sent to {target.email}')
        return True, ''

    except Exception as exc:
        err = str(exc)
        logger.error(f'Failed to send to {target.email}: {err}')
        target.email_failed = True
        target.email_error  = err
        target.save(update_fields=['email_failed', 'email_error'])
        return False, err


# ── Django-Q2 task functions ───────────────────────────────────────────────────
# These are plain functions — Django-Q2 calls them by import path,
# no decorators needed.

def send_campaign_email(target_id: int):
    """
    Django-Q2 task — sends one phishing email.
    Queued by launch_campaign_async() via async_task().
    """
    success, error = _send_single_email(target_id)
    if not success:
        raise Exception(error)   # causes Django-Q2 to mark task as failed


def launch_campaign_async(campaign_id: int):
    """
    Django-Q2 task — marks campaign as running then queues one
    send_campaign_email task per unsent target.

    Called by the admin launch action via async_task().
    """
    from apps.campaigns.models import Campaign
    from django_q.tasks import async_task

    try:
        campaign = Campaign.objects.get(id=campaign_id)
    except Campaign.DoesNotExist:
        logger.error(f'Campaign {campaign_id} not found.')
        return

    campaign.status      = Campaign.STATUS_RUNNING
    campaign.launched_at = timezone.now()
    campaign.save(update_fields=['status', 'launched_at'])

    targets = campaign.targets.filter(email_sent_at__isnull=True, email_failed=False)
    count = 0
    for t in targets:
        async_task(
            'apps.campaigns.tasks.send_campaign_email',
            t.id,
            task_name=f'send-email-{t.id}',
        )
        count += 1

    logger.info(f'Campaign {campaign_id} — queued {count} email tasks.')
    return count


def _launch_sync(campaign_id: int):
    """
    Synchronous fallback — sends all unsent emails in the current thread.
    Used when qcluster worker is not running.
    Returns (sent: int, failed: int, first_error: str).
    """
    from apps.campaigns.models import Campaign

    try:
        campaign = Campaign.objects.get(id=campaign_id)
    except Campaign.DoesNotExist:
        return 0, 0, f'Campaign {campaign_id} not found.'

    campaign.status      = Campaign.STATUS_RUNNING
    campaign.launched_at = timezone.now()
    campaign.save(update_fields=['status', 'launched_at'])

    targets = campaign.targets.filter(email_sent_at__isnull=True, email_failed=False)
    sent = failed = 0
    first_error = ''

    for t in targets:
        ok, err = _send_single_email(t.id)
        if ok:
            sent += 1
        else:
            failed += 1
            if not first_error:
                first_error = err

    logger.info(
        f'Campaign {campaign_id} sync launch — {sent} sent, {failed} failed.'
    )
    return sent, failed, first_error


def check_scheduled_campaigns():
    """
    Runs every minute via Django-Q2 scheduler.
    Finds campaigns whose scheduled_at has passed and launches them.
    """
    from apps.campaigns.models import Campaign
    from django_q.tasks import async_task

    now = timezone.now()

    due = Campaign.objects.filter(
        status=Campaign.STATUS_DRAFT,
        scheduled_at__isnull=False,
        scheduled_at__lte=now,
    )

    for campaign in due:
        if not campaign.targets.exists():
            logger.warning(
                f'Scheduled campaign "{campaign.name}" skipped — no targets.'
            )
            continue
        if not campaign.email_template:
            logger.warning(
                f'Scheduled campaign "{campaign.name}" skipped — no email template.'
            )
            continue
        if not campaign.smtp_host or not campaign.smtp_user:
            logger.warning(
                f'Scheduled campaign "{campaign.name}" skipped — SMTP not configured.'
            )
            continue

        logger.info(f'Launching scheduled campaign: "{campaign.name}"')
        try:
            async_task(
                'apps.campaigns.tasks.launch_campaign_async',
                campaign.id,
                task_name=f'launch-campaign-{campaign.id}',
            )
        except Exception as e:
            # Fallback to sync if Django-Q not available
            logger.warning(f'Django-Q unavailable ({e}), launching synchronously.')
            _launch_sync(campaign.id)