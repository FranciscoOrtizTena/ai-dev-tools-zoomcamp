from django.shortcuts import render, redirect, get_object_or_404
from .models import Todo
from django.utils import timezone

def todo_list(request):
    todos = Todo.objects.all().order_by('completed', 'due_date')
    return render(request, 'home.html', {'todos': todos})

def todo_create(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        due_date = request.POST.get('due_date')  # formato YYYY-MM-DD
        if title:
            Todo.objects.create(
                title=title,
                due_date=due_date or None,
            )
        return redirect('todo_list')
    return render(request, 'todo_form.html')

def todo_toggle(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    todo.completed = not todo.completed
    todo.save()
    return redirect('todo_list')

def todo_delete(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    todo.delete()
    return redirect('todo_list')
