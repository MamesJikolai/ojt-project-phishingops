from django.apps import AppConfig


class CampaignsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name  = 'apps.campaigns'
    label = 'campaigns'

    def ready(self):
        """
        Called once when Django starts.
        Creates the Django-Q2 schedule for auto-launching campaigns
        if it doesn't already exist in the database.
        """
        try:
            from django_q.models import Schedule

            Schedule.objects.get_or_create(
                func='apps.campaigns.tasks.check_scheduled_campaigns',
                defaults={
                    'name':          'Check Scheduled Campaigns',
                    'schedule_type': Schedule.MINUTES,
                    'minutes':       1,
                    'repeats':       -1,   # run indefinitely
                }
            )
        except Exception:
            # Silently ignore during first migration or if django_q tables
            # don't exist yet — the schedule will be created on next start
            pass