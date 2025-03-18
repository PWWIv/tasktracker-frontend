import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const RoleBasedRoute = ({ allowedRoles }) => {
    const { role } = useContext(AuthContext);   

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.includes(role)) {
        return <Outlet />;
    }

    return <Navigate to="/dashboard" replace />;
};

export default RoleBasedRoute; 