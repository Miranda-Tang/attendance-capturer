"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework import routers
from people import views
from django.http import HttpResponse

router = routers.DefaultRouter()
router.register(r'People', views.PeopleView, 'people')


def home(request):
    return HttpResponse("Welcome to the Attendance App API")


urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/attendance/<admin_id>/', views.get_attendance_by_admin, name="get_attendance"),
    path('api/upload_attendance_picture/',
         views.upload_attendance_picture, name='upload_attendance_picture'),
    path('api/create_profile/', views.create_profile, name='create_profile'),
    path('api/profiles/<profile_id>/', views.get_profiles, name='get_profiles'),
    path('api/update_profile/', views.update_profile, name='update_profile'),
    path('api/profiles_by_admin/<admin_id>/', views.get_profile_by_admin, name='get_profile_by_admin'),
]
