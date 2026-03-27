import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
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

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/find-leads" element={<LeadFinder />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/products" element={<Products />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/compose" element={<EmailComposer />} />
            <Route path="/history" element={<EmailHistory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
