# Generated by Django 5.1.3 on 2024-11-28 07:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('people', '0003_alter_attendance_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='attendance',
            name='photo_url',
            field=models.CharField(max_length=1000),
        ),
    ]