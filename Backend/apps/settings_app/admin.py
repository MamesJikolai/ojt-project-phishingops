from django import forms
from django.contrib import admin
from django.shortcuts import redirect
from django.utils.safestring import mark_safe
from django.urls import path
from django.core.mail import EmailMessage
from django.core.mail.backends.smtp import EmailBackend
from django.http import HttpResponse
from django.middleware.csrf import get_token
import logging

from .models import PlatformSettings

logger = logging.getLogger(__name__)


class SMTPTestForm(forms.Form):
    smtp_host     = forms.CharField(max_length=255)
    smtp_port     = forms.IntegerField(initial=587)
    smtp_user     = forms.CharField(max_length=255)
    smtp_password = forms.CharField(widget=forms.PasswordInput)
    smtp_use_tls  = forms.BooleanField(required=False, initial=True)
    smtp_use_ssl  = forms.BooleanField(required=False)
    from_email    = forms.EmailField()
    to_email      = forms.EmailField(label='Send test to')


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ('General', {
            'fields': ('platform_name', 'logo'),
        }),
        ('URLs', {
            'fields': ('platform_base_url', 'frontend_url', 'lms_path'),
            'description': (
                'platform_base_url is used when building phishing links. '
                'frontend_url + lms_path together form the redirect URL employees '
                'land on after clicking — e.g. http://localhost:5173/lms'
            ),
        }),
        ('Campaign Defaults', {
            'fields': ('default_from_name',),
        }),
        ('Landing Page Content', {
            'fields': (
                'landing_title',
                'landing_message1',
                'landing_message2',
                'landing_button_text',
            ),
            'description': (
                'Text displayed on the employee training page after they click '
                'a phishing link. These values are returned by the API and '
                'used by the React frontend to render the landing page.'
            ),
        }),
        ('LMS', {
            'fields': ('session_expiry_days', 'allow_quiz_retake'),
        }),
        ('SMTP Test', {
            'fields': (),
            'description': mark_safe(
                '<br>'
                '<a class="button" href="/admin/settings_app/smtp-test/" '
                'style="padding:8px 18px; background:#417690; color:white; '
                'border-radius:4px; text-decoration:none; font-weight:bold; '
                'display:inline-block; margin-top:4px;">'
                '&rarr; Open SMTP / Email Test</a>'
            ),
        }),
        ('Meta', {
            'fields': ('updated_at',),
            'classes': ('collapse',),
        }),
    )
    readonly_fields = ('updated_at',)

    def has_add_permission(self, request):
        return not PlatformSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = PlatformSettings.get()
        return redirect(
            f'/admin/settings_app/platformsettings/{obj.pk}/change/'
        )

    def get_urls(self):
        urls = super().get_urls()
        # Register at the ModelAdmin level — but route from the site level below
        return urls

    def smtp_test_view(self, request):
        form        = SMTPTestForm(request.POST or None)
        result_html = ''

        if request.method == 'POST' and form.is_valid():
            d = form.cleaned_data
            try:
                backend = EmailBackend(
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
                        'This is a test email from your PhishingOps platform.\n\n'
                        'If you received this, your SMTP configuration is '
                        'working correctly.\n\n'
                        f'SMTP Host: {d["smtp_host"]}:{d["smtp_port"]}\n'
                        f'From:      {d["from_email"]}\n'
                        f'TLS: {d["smtp_use_tls"]}  SSL: {d["smtp_use_ssl"]}'
                    ),
                    from_email=d['from_email'],
                    to=[d['to_email']],
                    connection=backend,
                )
                msg.send()
                result_html = (
                    '<p class="result-ok">'
                    f'&#10003; Test email sent successfully to '
                    f'<strong>{d["to_email"]}</strong>.</p>'
                )
                logger.info(f'SMTP test succeeded — sent to {d["to_email"]}')
            except Exception as e:
                result_html = (
                    '<p class="result-err">'
                    f'&#10007; SMTP test failed: <strong>{e}</strong></p>'
                )
                logger.error(f'SMTP test failed: {e}')

        def row(label, field):
            errors = (
                f'<p class="field-error">{field.errors.as_text()}</p>'
                if field.errors else ''
            )
            return (
                f'<div class="form-row">'
                f'<label class="field-label">{label}:</label>'
                f'{field}{errors}</div>'
            )

        form_html = (
            row('SMTP Host',     form['smtp_host'])     +
            row('SMTP Port',     form['smtp_port'])     +
            row('SMTP Username', form['smtp_user'])     +
            row('SMTP Password', form['smtp_password']) +
            f'<div class="form-row checkbox-row">'
            f'<label class="field-label checkbox-label">'
            f'{form["smtp_use_tls"]} Use TLS</label></div>'
            f'<div class="form-row checkbox-row">'
            f'<label class="field-label checkbox-label">'
            f'{form["smtp_use_ssl"]} Use SSL</label></div>' +
            row('From Email',   form['from_email']) +
            row('Send Test To', form['to_email'])
        )

        csrf_token = get_token(request)

        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>SMTP Test | PhishingOps Admin</title>
    <link rel="stylesheet" href="/static/admin/css/base.css">
    <style>
        /* ── Base layout ─────────────────────────────────────── */
        :root {{
            --bg:          #f8f8f8;
            --surface:     #ffffff;
            --border:      #cccccc;
            --text:        #333333;
            --text-muted:  #666666;
            --label:       #333333;
            --btn-bg:      #417690;
            --btn-hover:   #205067;
            --btn-text:    #ffffff;
            --input-bg:    #ffffff;
            --input-border:#cccccc;
            --ok-bg:       #dff0d8;
            --ok-border:   #3c763d;
            --ok-text:     #2d6a2d;
            --err-bg:      #f2dede;
            --err-border:  #a94442;
            --err-text:    #a94442;
            --header-bg:   #417690;
            --header-text: #ffffff;
            --link:        #447e9b;
        }}

        /* ── Dark mode overrides ──────────────────────────────── */
        @media (prefers-color-scheme: dark) {{
            :root {{
                --bg:          #121212;
                --surface:     #121212;
                --border:      #353535;
                --text:        #e0e0e0;
                --text-muted:  #aaaaaa;
                --label:       #cccccc;
                --btn-bg:      #205067;
                --btn-hover:   #417690;
                --btn-text:    #ffffff;
                --input-bg:    #121212;
                --input-border:#353535;
                --ok-bg:       #1a3a1a;
                --ok-border:   #3c763d;
                --ok-text:     #7ec87e;
                --err-bg:      #3a1a1a;
                --err-border:  #a94442;
                --err-text:    #e07070;
                --header-bg:   #417690;
                --header-text: #e0e0e0;
                --link:        #6ab0d4;
            }}
        }}

        * {{ box-sizing: border-box; margin: 0; padding: 0; }}

        body {{
            background: var(--bg);
            color: var(--text);
            font-family: "Roboto", "Lucida Grande", sans-serif;
            font-size: 14px;
        }}

        #container {{ padding: 20px; max-width: 680px; }}

        /* ── Header ───────────────────────────────────────────── */
        #header {{
            background: var(--header-bg);
            padding: 10px 20px;
            margin: -20px -20px 20px;
        }}
        #header h1 a {{
            color: var(--header-text);
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
        }}

        /* ── Breadcrumbs ──────────────────────────────────────── */
        .breadcrumbs {{
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            padding: 8px 20px;
            margin: -20px -20px 20px;
            font-size: 12px;
        }}
        .breadcrumbs a {{ color: var(--link); text-decoration: none; }}
        .breadcrumbs a:hover {{ text-decoration: underline; }}

        /* ── Content ──────────────────────────────────────────── */
        h1 {{ font-size: 20px; margin-bottom: 12px; color: var(--text); }}
        p  {{ margin-bottom: 12px; color: var(--text-muted); }}

        /* ── Result banners ───────────────────────────────────── */
        .result-ok {{
            padding: 10px 16px;
            background: var(--ok-bg);
            border: 1px solid var(--ok-border);
            border-radius: 4px;
            color: var(--ok-text);
            margin-bottom: 16px;
        }}
        .result-err {{
            padding: 10px 16px;
            background: var(--err-bg);
            border: 1px solid var(--err-border);
            border-radius: 4px;
            color: var(--err-text);
            margin-bottom: 16px;
        }}

        /* ── Fieldset ─────────────────────────────────────────── */
        fieldset {{
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 16px 20px;
            margin-bottom: 20px;
            background: var(--surface);
        }}
        legend {{
            font-weight: bold;
            padding: 0 8px;
            color: var(--text);
        }}

        /* ── Form rows ────────────────────────────────────────── */
        .form-row {{
            margin-bottom: 12px;
        }}
        .field-label {{
            display: block;
            font-weight: bold;
            margin-bottom: 4px;
            color: var(--label);
        }}
        .checkbox-row {{ margin-bottom: 8px; }}
        .checkbox-label {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            font-weight: bold;
            color: var(--label);
        }}
        .field-error {{
            color: var(--err-text);
            font-size: 12px;
            margin-top: 3px;
        }}

        /* ── Inputs ───────────────────────────────────────────── */
        input[type=text],
        input[type=number],
        input[type=email],
        input[type=password] {{
            padding: 6px 10px;
            border: 1px solid var(--input-border);
            border-radius: 4px;
            width: 320px;
            background: var(--input-bg);
            color: var(--text);
            font-size: 14px;
        }}
        input[type=text]:focus,
        input[type=number]:focus,
        input[type=email]:focus,
        input[type=password]:focus {{
            outline: 2px solid var(--btn-bg);
            border-color: var(--btn-bg);
        }}

        /* ── Button ───────────────────────────────────────────── */
        .submit-btn {{
            background: var(--btn-bg);
            color: var(--btn-text);
            padding: 9px 22px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background 0.15s;
        }}
        .submit-btn:hover {{ background: var(--btn-hover); }}

        .back-link {{
            color: var(--link);
            text-decoration: none;
            margin-left: 16px;
            font-size: 13px;
        }}
        .back-link:hover {{ text-decoration: underline; }}
    </style>
</head>
<body>
<div id="container">

    <div id="header">
        <h1><a href="/admin/">PhishingOps Administration</a></h1>
    </div>

    <div class="breadcrumbs">
        <a href="/admin/">Home</a> &rsaquo;
        <a href="/admin/settings_app/platformsettings/">Platform Settings</a> &rsaquo;
        SMTP / Email Test
    </div>

    <h1>SMTP / Email Test</h1>
    <p>Fill in your SMTP credentials and send a test email to verify the
       connection works before using it in a campaign.</p>

    {result_html}

    <form method="post">
        <input type="hidden" name="csrfmiddlewaretoken" value="{csrf_token}">

        <fieldset>
            <legend>SMTP Connection</legend>
            {form_html}
        </fieldset>

        <div>
            <button type="submit" class="submit-btn">Send Test Email</button>
            <a href="/admin/settings_app/platformsettings/" class="back-link">
                &larr; Back to Settings
            </a>
        </div>
    </form>

</div>
</body>
</html>"""

        return HttpResponse(html)
