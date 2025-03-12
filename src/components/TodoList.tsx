"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp } from "lucide-react";

// Import dnd-kit components
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  order?: number; // Optional order property for sorting
};

// Sortable Todo Item component
function SortableTodoItem({
  todo,
  toggleTodo,
  deleteTodo,
}: {
  todo: Todo;
  toggleTodo: (id: number) => void;
  deleteTodo: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 border rounded-md cursor-move"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => toggleTodo(todo.id)}
        />
        <label
          htmlFor={`todo-${todo.id}`}
          className={`text-sm ${
            todo.completed ? "line-through text-muted-foreground" : ""
          }`}
        >
          {todo.text}
        </label>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => deleteTodo(todo.id)}
        className="h-8 w-8 p-0"
      >
        ✕
      </Button>
    </div>
  );
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

  // Load todos from localStorage on component mount
  useEffect(() => {
    try {
      const savedTodos = localStorage.getItem("todos");
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos));
      }
    } catch (error) {
      console.error("Error loading todos from localStorage:", error);
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    try {
      localStorage.setItem("todos", JSON.stringify(todos));
    } catch (error) {
      console.error("Error saving todos to localStorage:", error);
    }
  }, [todos]);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Generate a unique ID for new todos
  const generateId = () => {
    return todos.length > 0 ? Math.max(...todos.map((todo) => todo.id)) + 1 : 1;
  };

  // Add a new todo
  const addTodo = () => {
    if (newTodo.trim() === "") return;

    const todo: Todo = {
      id: generateId(),
      text: newTodo,
      completed: false,
    };

    setTodos([...todos, todo]);
    setNewTodo("");
  };

  // Toggle todo completion status
  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Delete a todo
  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // Handle key press (Enter) to add todo
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTodos((items) => {
        // Find the indices of the active and over items
        const activeIndex = items.findIndex((item) => item.id === active.id);
        const overIndex = items.findIndex((item) => item.id === over.id);

        // Only reorder if both items are in the same section (completed or active)
        const activeItem = items[activeIndex];
        const overItem = items[overIndex];

        if (activeItem.completed === overItem.completed) {
          return arrayMove(items, activeIndex, overIndex);
        }

        return items;
      });
    }
  };

  // Toggle completed tasks visibility
  const toggleCompletedVisibility = () => {
    setShowCompleted(!showCompleted);
  };

  // Separate active and completed todos
  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center ">
          Todo List
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button onClick={addTodo}>Add</Button>
        </div>

        {/* Active todos with drag and drop */}
        <div className="space-y-2 mb-4">
          {activeTodos.length === 0 && completedTodos.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No tasks yet. Add one above!
            </p>
          ) : activeTodos.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No active tasks. All tasks completed!
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeTodos.map((todo) => todo.id)}
                strategy={verticalListSortingStrategy}
              >
                {activeTodos.map((todo) => (
                  <SortableTodoItem
                    key={todo.id}
                    todo={todo}
                    toggleTodo={toggleTodo}
                    deleteTodo={deleteTodo}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Completed todos section with toggle */}
        {completedTodos.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <Button
              variant="ghost"
              className="w-full flex justify-between items-center py-2 mb-2"
              onClick={toggleCompletedVisibility}
            >
              <span className="font-medium">
                Completed ({completedTodos.length})
              </span>
              {showCompleted ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </Button>

            {showCompleted && (
              <div className="space-y-2 mt-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={completedTodos.map((todo) => todo.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {completedTodos.map((todo) => (
                      <SortableTodoItem
                        key={todo.id}
                        todo={todo}
                        toggleTodo={toggleTodo}
                        deleteTodo={deleteTodo}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div>{todos.length} task(s)</div>
        <div>{completedTodos.length} completed</div>
      </CardFooter>
    </Card>
  );
}
