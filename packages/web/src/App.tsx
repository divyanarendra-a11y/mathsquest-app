import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { WorldMap } from './pages/WorldMap';
import { WorldDetail } from './pages/WorldDetail';
import { PrimeSmash } from './pages/PrimeSmash';
import { RobotFactory } from './pages/RobotFactory';
import { RecipeRescaler } from './pages/RecipeRescaler';
import { Login } from './pages/Login';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <WorldMap />
            </RequireAuth>
          }
        />
        <Route
          path="/worlds/:slug"
          element={
            <RequireAuth>
              <WorldDetail />
            </RequireAuth>
          }
        />
        <Route
          path="/puzzles/prime-smash"
          element={
            <RequireAuth>
              <PrimeSmash />
            </RequireAuth>
          }
        />
        <Route
          path="/puzzles/robot-factory"
          element={
            <RequireAuth>
              <RobotFactory />
            </RequireAuth>
          }
        />
        <Route
          path="/puzzles/recipe-rescaler"
          element={
            <RequireAuth>
              <RecipeRescaler />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
