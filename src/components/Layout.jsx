import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 ml-20 p-8 transition-all duration-300">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout; 