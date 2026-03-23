from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Adds a role field for access control:
        - admin : full access (create/edit/delete campaigns, templates, courses)
        - hr    : view-only access (read campaigns, targets, analytics)
    """

    ROLE_ADMIN = 'admin'
    ROLE_HR    = 'hr'

    ROLE_CHOICES = [
        (ROLE_ADMIN, 'admin'),
        (ROLE_HR,    'hr'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_ADMIN,
        help_text='Admin = full access. HR = view-only access.',
    )

    class Meta:
        verbose_name        = 'User'
        verbose_name_plural = 'Users'
        ordering            = ['-date_joined']

    def __str__(self):
        return f'{self.username} ({self.get_role_display()})'

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN

    @property
    def is_hr(self):
        return self.role == self.ROLE_HR

    @property
    def is_view_only(self):
        """HR users can only view data, not create or modify anything."""
        return self.role == self.ROLE_HR
