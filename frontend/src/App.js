import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import LeadFinder from "@/pages/LeadFinder";
import Orders from "@/pages/Orders";
import Products from "@/pages/Products";
import Recipes from "@/pages/Recipes";
import Templates from "@/pages/Templates";
import EmailComposer from "@/pages/EmailComposer";
import EmailHistory from "@/pages/EmailHistory";
import Settings from "@/pages/Settings";
import RoutePlanner from "@/pages/RoutePlanner";
import Specifications from "@/pages/Specifications";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect to home if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Route */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/find-leads" element={<LeadFinder />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/products" element={<Products />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/specifications" element={<Specifications />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/compose" element={<EmailComposer />} />
                <Route path="/history" element={<EmailHistory />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/route-planner" element={<RoutePlanner />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
