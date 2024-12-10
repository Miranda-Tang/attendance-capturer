from django.contrib import admin
from .models import Attendance, Profile

# Admin class for the Attendance model


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('profile', 'photo_url', 'timestamp')

# Admin class for the Profile model

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('profile_id', 'profile_name', 'profile_image', 'admin_id')
