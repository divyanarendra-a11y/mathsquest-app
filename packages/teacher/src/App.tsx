import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { TeacherLogin } from './pages/TeacherLogin';
import { Dashboard } from './pages/Dashboard';

function RequireTeacherAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('mq_teacher_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ClassDashboard() {
  const { classId } = useParams<{ classId: string }>();
  return <Dashboard classId={classId!} />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<TeacherLogin />} />
        <Route
          path="/class/:classId"
          element={
            <RequireTeacherAuth>
              <ClassDashboard />
            </RequireTeacherAuth>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
