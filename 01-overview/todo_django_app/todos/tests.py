from django.test import TestCase
from django.urls import reverse
from .models import Todo

class TodoTests(TestCase):
    def test_create_todo(self):
        response = self.client.post(reverse('todo_create'), {
            'title': 'Test TODO',
            'due_date': '2025-12-31'
        })
        self.assertEqual(response.status_code, 302)  # redirect
        self.assertEqual(Todo.objects.count(), 1)
