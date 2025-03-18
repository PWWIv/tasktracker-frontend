import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { setToken, role } = useContext(AuthContext);

    const allMenuItems = [
        { path: '/dashboard', label: 'Дашборд', icon: '📊', roles: ['admin', 'employee', 'client'] },
        { path: '/tasks', label: 'Задачи', icon: '📝', roles: ['admin', 'employee'] },
        { path: '/profile', label: 'Профиль', icon: '👤', roles: ['admin', 'employee'] },
        { path: '/users', label: 'Пользователи', icon: '👥', roles: ['admin'] },
    ];

    const menuItems = allMenuItems.filter(item => item.roles.includes(role));

    const handleLogout = () => {
        setToken(null);
    };

    return (
        <div 
            className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-50
                ${isOpen ? 'w-64' : 'w-20'}`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <div className="p-4 border-b">
                <h1 className={`font-bold text-xl ${!isOpen && 'hidden'}`}>TaskTracker</h1>
            </div>

            <nav className="mt-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${
                            location.pathname === item.path ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                    >
                        <span className="text-xl mr-3">{item.icon}</span>
                        {isOpen && <span>{item.label}</span>}
                    </Link>
                ))}
            </nav>

            <div className="absolute bottom-0 w-full p-4 border-t">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-red-600 hover:bg-red-50 px-4 py-2 rounded"
                >
                    <span className="text-xl mr-3">🚪</span>
                    {isOpen && <span>Выйти</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar; 