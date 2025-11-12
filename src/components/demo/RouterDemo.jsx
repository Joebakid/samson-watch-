import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
const Home = () => (<div className="p-4"><h2 className="text-xl font-semibold">Home Page</h2><p className="mt-2 text-gray-600">Welcome to the home page!</p></div>);
const About = () => (<div className="p-4"><h2 className="text-xl font-semibold">About Page</h2><p className="mt-2 text-gray-600">This is the about page.</p></div>);
const Navigation = () => { const navigate = useNavigate(); return (
  <nav className="flex gap-4 p-4 bg-gray-100 rounded">
    <Link to="/" className="text-blue-500 hover:text-blue-700">Home</Link>
    <Link to="/about" className="text-blue-500 hover:text-blue-700">About</Link>
    <button onClick={() => navigate('/about')} className="px-2 py-1 text-xs bg-blue-500 text-white rounded">Navigate to About</button>
  </nav>); };
export default function RouterDemo() {
  return (
    <div className="mt-6 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-3">React Router Demo</h3>
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Router>
    </div>
  );
}