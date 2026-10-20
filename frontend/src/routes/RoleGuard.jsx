import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleGuard({ allowedRole, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    // If logged in as Recruiter but trying to visit Candidate route, redirect to Recruiter dashboard (and vice versa)
    const fallbackPath =
      user.role === 'RECRUITER' ? '/recruiter/dashboard' : '/candidate/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
