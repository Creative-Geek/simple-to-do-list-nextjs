import TodoList from '@/components/TodoList';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50 dark:bg-stone-950">
      <TodoList />
    </div>
  );
}
