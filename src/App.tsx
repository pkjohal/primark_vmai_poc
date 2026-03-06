import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NavBar } from './components/layout/NavBar';
import { BottomNav } from './components/layout/BottomNav';
import { LoginScreen } from './screens/LoginScreen';
import { ScanScreen } from './screens/ScanScreen';
import { ProductScreen } from './screens/ProductScreen';
import { FlagScreen } from './screens/FlagScreen';
import { TasksScreen } from './screens/TasksScreen';
import { TaskDetailScreen } from './screens/TaskDetailScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { AdminScreen } from './screens/AdminScreen';
import { useToast } from './context/ToastContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RoleRoute({
  children,
  allowed,
}: {
  children: React.ReactNode;
  allowed: boolean;
}) {
  const { showToast } = useToast();
  if (!allowed) {
    showToast("You don't have permission to view that page.", 'error');
    return <Navigate to="/scan" replace />;
  }
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-light-grey overflow-hidden">
      <NavBar />
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const { user, canViewTasks, canViewDashboard, canManageUsers } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/scan" replace /> : <LoginScreen />} />

      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <AppLayout><ScanScreen /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/product/:ean"
        element={
          <ProtectedRoute>
            <AppLayout><ProductScreen /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/flag/:ean"
        element={
          <ProtectedRoute>
            <AppLayout><FlagScreen /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <RoleRoute allowed={canViewTasks}>
              <AppLayout><TasksScreen /></AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowed={canViewTasks}>
              <AppLayout><TaskDetailScreen /></AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowed={canViewDashboard}>
              <AppLayout><DashboardScreen /></AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowed={canManageUsers}>
              <AppLayout><AdminScreen /></AppLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={user ? '/scan' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={user ? '/scan' : '/login'} replace />} />
    </Routes>
  );
}
