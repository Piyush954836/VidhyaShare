import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, token, loadingSession } = useAuth();

    // 1. Wait until the session is finished loading
    if (loadingSession) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Authenticating...</p>
            </div>
        );
    }

    // 2. If no token or user, redirect to login
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // 3. If user is not an admin, redirect to the home/dashboard page
    if (user.role !== 'admin') {
        // You can also redirect to a dedicated "403 Forbidden" page
        return <Navigate to="/" replace />;
    }

    // 4. If all checks pass, render the protected admin component
    return children;
};

export default AdminRoute;