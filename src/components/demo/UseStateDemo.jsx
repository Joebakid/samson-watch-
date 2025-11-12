import React, { useState, useEffect } from 'react';
export default function UseStateDemo() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [todos, setTodos] = useState([]);
  useEffect(() => { setTodos([{ id: 1, text: 'Learn React', completed: false }, { id: 2, text: 'Build awesome apps', completed: true }]); }, []);
  const addTodo = () => { if (name.trim()) { setTodos([...todos, { id: Date.now(), text: name, completed: false }]); setName(''); } };
  return (
    <div className="mt-6 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-3">useState + useEffect Demo</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-4"><span>Counter: {count}</span><button onClick={() => setCount(count + 1)} className="px-2 py-1 bg-green-500 text-white rounded text-sm">+1</button></div>
        <div className="flex gap-2"><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Add todo..." className="px-2 py-1 border rounded flex-1" /><button onClick={addTodo} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Add</button></div>
        <div className="space-y-1">{todos.map((t) => <div key={t.id} className="text-sm p-2 bg-gray-50 rounded">{t.text} {t.completed && '✓'}</div>)}</div>
      </div>
    </div>
  );
}