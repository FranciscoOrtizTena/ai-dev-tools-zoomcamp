from django.urls import path
from . import views

urlpatterns = [
    path('', views.todo_list, name='todo_list'),
    path('new/', views.todo_create, name='todo_create'),
    path('<int:pk>/toggle/', views.todo_toggle, name='todo_toggle'),
    path('<int:pk>/delete/', views.todo_delete, name='todo_delete'),
]
