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
    )
    footer = '</body></html>'
    return header + body_content + footer

    
def _append_signature(html_body: str, template):
    """
    Appends a text signature and the signature_image from the model.
    """
    # If there is no image AND no specific company name, you might still want 
    # a basic text signature, or you can just return the body as-is.
    if not template.signature_image and not template.company_name:
        return html_body, None, None, None

    try:
        import mimetypes
        
        # 1. Prepare Image Data if it exists
        image_data, mime, cid = None, None, None
        img_html = ""
        
        if template.signature_image:
            sig_path = template.signature_image.path
            mime, _  = mimetypes.guess_type(sig_path)
            mime     = mime or 'image/png'
            cid      = 'signature_image_phishing' # Simple ID
            
            with open(sig_path, 'rb') as f:
                image_data = f.read()
            
            img_html = f'<div style="margin-top:12px;"><img src="cid:{cid}" style="max-width:200px;height:auto;display:block;" alt="Logo" /></div>'

        # 2. Build the Text + Image Signature
        # We use the sender_name and company_name directly from the model
        # 2. Build the Text + Image Signature (Inline Layout)
        company = template.company_name or ""
        sender = template.sender_name or "Support Team"
        
        # We use a table with two cells (<td>) to put the image and text side-by-side
        sig_html = (
            '<div style="margin-top:24px; padding-top:16px; border-top:1px solid #e0e0e0;">'
                '<table border="0" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif; color:#666666;">'
                    '<tr>'
                        # Left Cell: The Image
                        f'<td style="vertical-align: middle; padding-right: 15px;">'
                            f'<img src="cid:{cid}" style="max-width:200px; height:auto; display:block;" alt="Logo" />'
                        '</td>'
                        # Right Cell: The Text (with a vertical line separator)
                        '<td style="vertical-align: middle; padding-left: 15px; border-left: 1px solid #cccccc; line-height: 1.4;">'
                            f'<p style="margin:0; font-size:16px; font-weight:bold; color:#333333;">{sender}</p>'
                            f'<p style="margin:0; font-size:13px; color:#666666;">{company}</p>'
                            '<p style="margin:0; font-size:12px; font-style:italic; color:#888888;">Security Awareness Team</p>'
                        '</td>'
                    '</tr>'
                '</table>'
            '</div>'
        )

        # 3. Inject into HTML
        if '</body>' in html_body:
            html_body = html_body.replace('</body>', sig_html + '</body>', 1)
        else:
            html_body = html_body + sig_html

        return html_body, image_data, mime, cid

    except Exception as exc:
        logger.warning(f'Signature could not be fully loaded: {exc}')
        return html_body, None, None, None


def render_body(body_html: str, target, campaign) -> str:
    """
    Replace {{ variable }} placeholders and ensure the result is
    valid HTML for email sending.

    If the template body contains HTML tags it is used as-is (after
    variable substitution). If it is plain text, newlines are
    converted to <br> / <p> tags so the formatting is preserved.
    """
    if campaign.email_template and campaign.email_template.company_name:
        company = campaign.email_template.company_name
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

    body = _convert_markdown_links(body)

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

        html_body = render_body(template.body_html, target, campaign)
        html_body, sig_data, sig_mime, sig_cid = _append_signature(html_body, template)
        from_header = f'{template.sender_name} <{campaign.from_email}>'

        msg = EmailMultiAlternatives(
            subject=template.subject,
            body='Please enable HTML to view this security awareness email.',
            from_email=from_header,
            to=[target.email],
            connection=backend,
        )
        msg.attach_alternative(html_body, 'text/html')

        # Attach signature image as CID inline
        if sig_data and sig_mime and sig_cid:
            from email.mime.image import MIMEImage
            logger.info(f"DEBUG: Attaching signature. Size: {len(sig_data)} bytes. CID: {sig_cid}")
            img_part = MIMEImage(sig_data)
            img_part.add_header('Content-ID', f'<{sig_cid}>')            
            img_part.add_header(
                'Content-Disposition', 'inline',
                filename='signature'
            )
            msg.attach(img_part)

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

# ── Reminder and Manager Notification ─────────────────────────────────────────

def _get_reminder_backend():
    """
    Build an SMTP backend from PlatformSettings reminder credentials.
    Returns None if not configured.
    """
    from apps.settings_app.models import PlatformSettings
    from django.core.mail.backends.smtp import EmailBackend

    ps = PlatformSettings.get()
    if not ps.reminder_smtp_host or not ps.reminder_from_email:
        return None, None
    backend = EmailBackend(
        host=ps.reminder_smtp_host,
        port=ps.reminder_smtp_port,
        username=ps.reminder_smtp_user,
        password=ps.reminder_smtp_password,
        use_tls=ps.reminder_smtp_use_tls,
        use_ssl=ps.reminder_smtp_use_ssl,
        fail_silently=False,
        timeout=15,
    )
    from_header = f'{ps.reminder_from_name} <{ps.reminder_from_email}>'
    return backend, from_header


def send_manager_notification(target_id: int):
    """
    Django-Q2 task — notifies the target's manager when the employee
    clicks the phishing link.

    Triggered by tracking_views.phishing_click() on first click.
    Only runs if:
      - PlatformSettings.manager_notify_enabled = True
      - target.manager_email is set
    """
    from apps.campaigns.models import CampaignTarget
    from apps.settings_app.models import PlatformSettings
    from django.core.mail import EmailMultiAlternatives

    try:
        target = CampaignTarget.objects.select_related('campaign').get(id=target_id)
    except CampaignTarget.DoesNotExist:
        logger.error(f'Manager notification: target {target_id} not found.')
        return

    ps = PlatformSettings.get()
    if not ps.manager_notify_enabled:
        return
    if not target.manager_email:
        logger.info(
            f'Manager notification skipped for {target.email} '
            f'— no manager_email on record.'
        )
        return

    backend, from_header = _get_reminder_backend()
    if not backend:
        logger.warning('Manager notification skipped — reminder SMTP not configured.')
        return

    target_name    = target.full_name or target.email.split('@')[0]
    manager_name   = target.manager or 'Manager'
    campaign_name  = target.campaign.name
    company_name   = ps.platform_name

    subject = f'[{company_name}] Security Alert: {target_name} clicked a phishing link'

    html_body = (
        f'<p>Dear {manager_name},</p>'
        f'<p>This is an automated notification from the <strong>PhishingOps</strong> '
        f'Security Awareness Program.</p>'
        f'<p>Your team member <strong>{target_name}</strong> '
        f'({target.email}) clicked a simulated phishing link as part of the '
        f'<strong>{campaign_name}</strong> campaign.</p>'
        f'<p>They have been redirected to the security awareness training module. '
        f'You may wish to follow up with them to reinforce good security practices.</p>'
        f'<p><em>This message was sent automatically. Please do not reply.</em></p>'
        f'<p>— PhishingOps Security Team</p>'
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=f'{target_name} ({target.email}) clicked a phishing link in {campaign_name}.',
            from_email=from_header,
            to=[target.manager_email],
            connection=backend,
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send()
        logger.info(
            f'Manager notification sent to {target.manager_email} '
            f'for target {target.email}.'
        )
    except Exception as exc:
        logger.error(f'Manager notification failed for {target.email}: {exc}')


def send_reminder_email(target_id: int):
    """
    Django-Q2 task — sends a follow-up reminder to an employee who
    clicked the phishing link but has not completed training.

    Triggered by check_reminder_emails() schedule.
    """
    from apps.campaigns.models import CampaignTarget
    from apps.settings_app.models import PlatformSettings
    from django.core.mail import EmailMultiAlternatives

    try:
        target = CampaignTarget.objects.select_related('campaign').get(id=target_id)
    except CampaignTarget.DoesNotExist:
        logger.error(f'Reminder email: target {target_id} not found.')
        return

    # Double-check they still haven't completed (race condition guard)
    if target.lms_completed_at:
        logger.info(f'Reminder skipped for {target.email} — already completed.')
        return

    ps = PlatformSettings.get()
    backend, from_header = _get_reminder_backend()
    if not backend:
        logger.warning('Reminder email skipped — reminder SMTP not configured.')
        return

    target_name  = target.full_name or target.email.split('@')[0]
    company_name = ps.platform_name

    # Build the LMS link
    frontend_url = ps.frontend_url.rstrip('/')
    lms_path     = ps.lms_path.strip('/')
    path_part    = f'/{lms_path}' if lms_path else ''
    lms_url      = f'{frontend_url}{path_part}?token={target.token}'

    subject = f'[{company_name}] Reminder: Please complete your security awareness training'

    html_body = (
        f'<p>Dear {target_name},</p>'
        f'<p>This is a reminder that you have not yet completed your required '
        f'<strong>Security Awareness Training</strong> for '
        f'<strong>{company_name}</strong>.</p>'
        f'<p>Please click the link below to continue your training:</p>'
        f'<p><a href="{lms_url}" style="background:#024C89;color:white;'
        f'padding:10px 20px;border-radius:4px;text-decoration:none;'
        f'display:inline-block;">Continue Training</a></p>'
        f'<p>If the button does not work, copy and paste this link:<br>'
        f'<a href="{lms_url}">{lms_url}</a></p>'
        f'<p>This message was sent automatically. Please do not reply.</p>'
        f'<p>— {company_name} Security Team</p>'
    )

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=f'Please complete your security awareness training: {lms_url}',
            from_email=from_header,
            to=[target.email],
            connection=backend,
        )
        msg.attach_alternative(html_body, 'text/html')
        msg.send()
        logger.info(f'Reminder email sent to {target.email}.')
    except Exception as exc:
        logger.error(f'Reminder email failed for {target.email}: {exc}')


def check_reminder_emails():
    """
    Runs on schedule — finds targets who:
      1. Clicked the phishing link
      2. Have NOT completed LMS
      3. Clicked more than reminder_days ago
      4. Have not yet been sent a reminder (we track via a flag or simply
         check if a prior reminder was sent — simplest: re-send daily
         until completed, up to the reminder_days window)

    Runs every hour via Django-Q2 scheduler.
    """
    from apps.campaigns.models import CampaignTarget
    from apps.settings_app.models import PlatformSettings
    from django_q.tasks import async_task
    from django.utils import timezone
    from datetime import timedelta

    ps = PlatformSettings.get()
    if not ps.reminder_enabled:
        return

    cutoff = timezone.now() - timedelta(days=ps.reminder_days)

    # Targets who clicked at or before the cutoff and haven't completed
    due = CampaignTarget.objects.filter(
        link_clicked_at__isnull=False,
        link_clicked_at__lte=cutoff,
        lms_completed_at__isnull=True,
    )

    count = 0
    for target in due:
        try:
            async_task(
                'apps.campaigns.tasks.send_reminder_email',
                target.id,
                task_name=f'reminder-{target.id}',
            )
            count += 1
        except Exception as e:
            # Fallback sync
            send_reminder_email(target.id)
            count += 1

    if count:
        logger.info(f'Reminder emails queued: {count}')