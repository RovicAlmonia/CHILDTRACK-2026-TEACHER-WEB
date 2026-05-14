// src/components/PrincipalProtectedRoute.tsx
// Wraps any route that requires a logged-in principal.
// If no token is found in localStorage, redirects to /principal/login.

import { Navigate } from 'react-router-dom';

export default function PrincipalProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('principalToken');
  if (!token) return <Navigate to="/principal/login" replace />;
  return <>{children}</>;
}