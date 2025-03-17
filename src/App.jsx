import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
// import DashboardPage from './pages/DashboardPage';
// import TaskListPage from './pages/TaskListPage';
// import TaskDetailsPage from './pages/TaskDetailsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        {/* <Route path="/tasks" element={<TaskListPage />} /> */}
        {/* <Route path="/tasks/:id" element={<TaskDetailsPage />} /> */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;



// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   return (
//     <div className="min-h-screen bg-blue-100">
//       <div className="container mx-auto px-4 py-8">
//         <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">
//           Мой React + Vite + Tailwind проект
//         </h1>
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <p className="text-gray-700">
//             Добро пожаловать в ваш новый проект!
//           </p>
//           <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
//             Нажми меня
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default App