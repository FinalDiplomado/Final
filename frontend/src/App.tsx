import { Navigate, Route, Routes } from 'react-router-dom';
 
import { Layout } from './components/Layout';
import { useAuth } from './lib/auth';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { CreateEvaluationPage } from './pages/CreateEvaluationPage';
import { DashboardPage } from './pages/DashboardPage';
import { EvaluationDetailPage } from './pages/EvaluationDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role?.name !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Protected>
              <DashboardPage />
            </Protected>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/evaluations/new"
          element={
            <AdminOnly>
              <CreateEvaluationPage />
            </AdminOnly>
          }
        />
        <Route
          path="/evaluations/:id"
          element={
            <Protected>
              <EvaluationDetailPage />
            </Protected>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminOnly>
              <AdminUsersPage />
            </AdminOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
