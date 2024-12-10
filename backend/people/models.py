from django.db import models

# Create your models here.


class Profile(models.Model):
    profile_id = models.CharField(max_length=100, primary_key=True)
    profile_name = models.CharField(max_length=100)
    profile_image = models.CharField(max_length=1000)
    admin_id = models.CharField(max_length=100)

    def __str__(self):
        return self.profile_id


class Attendance(models.Model):
    id = models.AutoField(primary_key=True)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, null=True)
    photo_url = models.CharField(max_length=1000)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.id)
