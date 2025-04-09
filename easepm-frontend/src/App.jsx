import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProjectDetails from "./pages/Dashboard/ProjectDetails";
import ViewCloseOutReport from "./pages/Documents/ViewCloseOutReport";
import ViewLeanCanvas from "./pages/Documents/ViewLeanCanvas";
import ViewProjectBudgetReport from "./pages/Documents/ViewProjectBudgetReport";
import ViewProjectCharter from "./pages/Documents/ViewProjectCharter";
import ViewProjectPlan from "./pages/Documents/ViewProjectPlan";
import ViewRiskRegister from "./pages/Documents/ViewRiskRegister";
import ViewStakeholderRegister from "./pages/Documents/ViewStakeholderRegister";
import ViewWBSTree from "./pages/Documents/ViewWBSTree";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import './pages/styles/global.css';
import './pages/styles/theme.css';
import CloseOutReportTemplate from "./pages/Templates/CloseOutReportTemplate";
import LeanCanvasTemplate from "./pages/Templates/LeanCanvasTemplate";
import ProjectBudgetReportTemplate from "./pages/Templates/ProjectBudgetReportTemplate";
import ProjectCharterTemplate from "./pages/Templates/ProjectCharterTemplate";
import ProjectPlanTemplate from "./pages/Templates/ProjectPlanTemplate";
import RiskRegisterTemplate from "./pages/Templates/RiskRegisterTemplate";
import StakeholderRegisterTemplate from "./pages/Templates/StakeholderRegisterTemplate";
import Templates from "./pages/Templates/Templates";
import WBSTreeTemplate from "./pages/Templates/WBSTreeTemplate";

// Component to handle public routes - redirects if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAuthReady } = useAuth();
  
  // If auth is still initializing, show a loading indicator
  if (!isAuthReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Redirect root ("/") to "/home" */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      
      {/* Public routes */}
      <Route path="/home" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      {/* Protected routes - require authentication */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/projects/:id" element={
        <ProtectedRoute>
          <ProjectDetails />
        </ProtectedRoute>
      } />
      <Route path="/templates" element={
        <ProtectedRoute>
          <Templates />
        </ProtectedRoute>
      } />

      {/* Protected template routes */}
      <Route path="/templates/lean-canvas" element={
        <ProtectedRoute>
          <LeanCanvasTemplate />
        </ProtectedRoute>
      } />
      <Route path="/templates/project-charter" element={
        <ProtectedRoute>
          <ProjectCharterTemplate />
        </ProtectedRoute>
      } />
      <Route path="/templates/stakeholder-register" element={
        <ProtectedRoute>
          <StakeholderRegisterTemplate />
        </ProtectedRoute>
      } />
      <Route path="/templates/project-plan" element={
        <ProtectedRoute>
          <ProjectPlanTemplate />
        </ProtectedRoute>
      } />
      <Route path="/templates/work-breakdown-structure" element={
        <ProtectedRoute>
          <WBSTreeTemplate />
        </ProtectedRoute>
      } />
      <Route path="/templates/risk-register" element={
        <ProtectedRoute>
          <RiskRegisterTemplate />
        </ProtectedRoute>
      } />
      <Route path="/templates/close-out-report" element={
        <ProtectedRoute>
          <CloseOutReportTemplate />
        </ProtectedRoute>
      } />
      <Route path="/templates/project-budget" element={
        <ProtectedRoute>
          <ProjectBudgetReportTemplate />
        </ProtectedRoute>
      } />

      {/* Protected document view routes */}
      <Route path="/projects/:projectId/lean-canvas/view" element={
        <ProtectedRoute>
          <ViewLeanCanvas />
        </ProtectedRoute>
      } />
      <Route path="/projects/:projectId/project-charter/view" element={
        <ProtectedRoute>
          <ViewProjectCharter />
        </ProtectedRoute>
      } />
      <Route path="/projects/:projectId/risk-register/view" element={
        <ProtectedRoute>
          <ViewRiskRegister />
        </ProtectedRoute>
      } />
      <Route path="/projects/:projectId/stakeholder-register/view" element={
        <ProtectedRoute>
          <ViewStakeholderRegister />
        </ProtectedRoute>
      } />
      <Route path="/projects/:projectId/work-breakdown-structure/view" element={
        <ProtectedRoute>
          <ViewWBSTree />
        </ProtectedRoute>
      } />
      <Route path="/projects/:projectId/project-budget/view" element={
        <ProtectedRoute>
          <ViewProjectBudgetReport />
        </ProtectedRoute>
      } />
      <Route path="/projects/:projectId/project-plan/view" element={
        <ProtectedRoute>
          <ViewProjectPlan />
        </ProtectedRoute>
      } />
      <Route path="/projects/:projectId/close-out-report/view" element={
        <ProtectedRoute>
          <ViewCloseOutReport />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
