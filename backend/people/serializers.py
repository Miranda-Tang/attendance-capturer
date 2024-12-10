from rest_framework import serializers
from .models import Attendance, Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('profile_id', 'profile_name', 'profile_image', 'admin_id')


class AttendanceSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Attendance
        fields = ('id', 'profile', 'photo_url', 'timestamp')
