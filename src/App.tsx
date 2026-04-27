import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/800.css';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout            from './components/layout.tsx';
import LoginPage         from './pages/Loginpage.tsx';
import RegisterPage      from './pages/Registerpage.tsx';
import DashboardPage     from './pages/Dashboardpage.tsx';
import AttendancePage    from './pages/Attendancepage.tsx';
import AbsencesPage      from './pages/Absencespage.tsx';
import DropoutsPage      from './pages/Dropoutspage.tsx';
import GuardiansPage     from './pages/Guardianspage.tsx';
import StudentsPage      from './pages/Studentspage.tsx';
import NotificationsPage from './pages/Notificationspage.tsx';

function Protected({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}
function Public({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return !token ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Public><LoginPage /></Public>} />
      <Route path="/register" element={<Public><RegisterPage /></Public>} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index                element={<DashboardPage />} />
        <Route path="attendance"    element={<AttendancePage />} />
        <Route path="absences"      element={<AbsencesPage />} />
        <Route path="dropouts"      element={<DropoutsPage />} />
        <Route path="guardians"     element={<GuardiansPage />} />
        <Route path="students"      element={<StudentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}

// ThemeProvider and CssBaseline are now handled inside Layout so the
// dark mode toggle can control the active theme dynamically.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}