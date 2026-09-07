import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RotaProtegida({ children, exigirAdmin = false }) {
  const { estaAutenticado, ehAdmin } = useAuth();
  const location = useLocation();

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ de: location.pathname }} replace />;
  }

  if (exigirAdmin && !ehAdmin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
