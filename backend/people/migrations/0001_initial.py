# Generated by Django 5.1.3 on 2024-11-27 03:07

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('profile_id', models.CharField(max_length=100, primary_key=True, serialize=False)),
                ('profile_name', models.CharField(max_length=100)),
                ('profile_image', models.CharField(max_length=100)),
                ('admin_id', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='Attendance',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=True)),
                ('photo_url', models.CharField(max_length=100)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('profile', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='people.profile')),
            ],
        ),
    ]