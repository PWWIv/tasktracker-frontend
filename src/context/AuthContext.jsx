import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({
    token: null,
    role: null,
    setToken: () => {},
    setRole: () => {},
});

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [role, setRole] = useState(localStorage.getItem('role'));

    useEffect(() => {
    }, [role]);

    const updateToken = (newToken) => {
        setToken(newToken);
        if (newToken) {
            localStorage.setItem('token', newToken);
        } else {
            localStorage.removeItem('token');
        }
    };

    const updateRole = (newRole) => {
        setRole(newRole);
        if (newRole) {
            localStorage.setItem('role', newRole);
        } else {
            localStorage.removeItem('role');
        }
    };

    return (
        <AuthContext.Provider value={{ token, role, setToken: updateToken, setRole: updateRole }}>
            {children}
        </AuthContext.Provider>
    );
};
