import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/800.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout';
import LoginPage from './pages/Loginpage';
import RegisterPage from './pages/Registerpage';
import DashboardPage from './pages/Dashboardpage';
import AttendancePage from './pages/Attendancepage';
import AbsencesPage from './pages/Absencespage';
import DropoutsPage from './pages/Dropoutspage';
import GuardiansPage from './pages/Guardianspage';
import StudentsPage from './pages/Studentspage';
import NotificationsPage from './pages/Notificationspage';
import PrincipalLogin from './pages/PrincipalLogin';
import PrincipalDashboard from './pages/PrincipalDashboard/PrincipalDashboard';
import PrincipalProtectedRoute from './components/PrincipalProtectedRoute';
function Protected({ children }) {
    const { token } = useAuth();
    return token ? <>{children}</> : <Navigate to="/login" replace/>;
}
function Public({ children }) {
    const { token } = useAuth();
    return !token ? <>{children}</> : <Navigate to="/" replace/>;
}
function AppRoutes() {
    return (<Routes>
      <Route path="/login" element={<Public><LoginPage /></Public>}/>
      <Route path="/register" element={<Public><RegisterPage /></Public>}/>

      <Route path="/principal/login" element={<PrincipalLogin />}/>
      <Route path="/principal" element={<PrincipalProtectedRoute>
          <PrincipalDashboard />
        </PrincipalProtectedRoute>}/>

      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<DashboardPage />}/>
        <Route path="attendance" element={<AttendancePage />}/>
        <Route path="absences" element={<AbsencesPage />}/>
        <Route path="dropouts" element={<DropoutsPage />}/>
        <Route path="guardians" element={<GuardiansPage />}/>
        <Route path="students" element={<StudentsPage />}/>
        <Route path="notifications" element={<NotificationsPage />}/>
      </Route>
    </Routes>);
}
export default function App() {
    return (<BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>);
}
