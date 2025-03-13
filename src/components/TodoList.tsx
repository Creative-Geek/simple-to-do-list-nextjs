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
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";

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
  isAnimating?: boolean; // Flag to track animation state
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
      className="group flex items-center justify-between p-2 border rounded-md transition-all duration-300 ease-in-out"
    >
      <div className="flex items-center space-x-2">
        <div
          className="touch-none flex items-center mr-2 opacity-40 md:opacity-0 md:group-hover:opacity-40 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} className="cursor-grab" />
        </div>
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => toggleTodo(todo.id)}
        />
        <span
          className={`text-sm relative ${
            todo.completed ? "text-muted-foreground" : ""
          }`}
        >
          {todo.text}
          {todo.completed && (
            <span
              className="absolute left-0 top-1/2 w-0 h-0.5 bg-current animate-strikethrough"
              style={{
                width: "100%",
                transition: "width 0.3s ease-in-out",
                animation: "strikethrough 0.3s ease-in-out forwards",
              }}
            />
          )}
        </span>
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
        todo.id === id
          ? { ...todo, completed: !todo.completed, isAnimating: true }
          : todo
      )
    );

    // After animation completes, reset the animation flag
    setTimeout(() => {
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === id ? { ...todo, isAnimating: false } : todo
        )
      );
    }, 300); // Match animation duration
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
