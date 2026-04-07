import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import AIChatWidget from "@/components/AIChatWidget";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import LeadFinder from "@/pages/LeadFinder";
import Orders from "@/pages/Orders";
import Products from "@/pages/Products";
import ProductVideos from "@/pages/ProductVideos";
import Recipes from "@/pages/Recipes";
import Templates from "@/pages/Templates";
import EmailComposer from "@/pages/EmailComposer";
import EmailHistory from "@/pages/EmailHistory";
import MailPage from "@/pages/MailInbox";
import Settings from "@/pages/Settings";
import RoutePlanner from "@/pages/RoutePlanner";
import Specifications from "@/pages/Specifications";
import DailyReports from "@/pages/DailyReports";
import Shipments from "@/pages/Shipments";
import AdminPage from "@/pages/AdminPage";
import AIAnalytics from "@/pages/AIAnalytics";
import CustomerSegmentation from "@/pages/CustomerSegmentation";
import FoodFairs from "@/pages/FoodFairs";
import DonerNews from "@/pages/DonerNews";

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
                <Route path="/shipments" element={<Shipments />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product-videos" element={<ProductVideos />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/specifications" element={<Specifications />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/mail" element={<MailPage />} />
                <Route path="/mail-inbox" element={<MailPage />} />
                <Route path="/compose" element={<EmailComposer />} />
                <Route path="/history" element={<EmailHistory />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/route-planner" element={<RoutePlanner />} />
                <Route path="/daily-reports" element={<DailyReports />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/ai-analytics" element={<AIAnalytics />} />
                <Route path="/customer-segments" element={<CustomerSegmentation />} />
                <Route path="/food-fairs" element={<FoodFairs />} />
                <Route path="/doner-news" element={<DonerNews />} />
              </Routes>
            </Layout>
            {/* AI Chat Widget - floating button */}
            <AIChatWidget />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
