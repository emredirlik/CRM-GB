import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 dakika timeout (AI araması uzun sürebilir)
});

// Lead APIs
export const getLeads = () => api.get('/leads');
export const getLead = (id) => api.get(`/leads/${id}`);
export const createLead = (data) => api.post('/leads', data);
export const updateLead = (id, data) => api.put(`/leads/${id}`, data);
export const deleteLead = (id) => api.delete(`/leads/${id}`);

// Template APIs
export const getTemplates = () => api.get('/templates');
export const getTemplate = (id) => api.get(`/templates/${id}`);
export const createTemplate = (data) => api.post('/templates', data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);

// SMTP Settings APIs
export const getSMTPSettings = () => api.get('/settings/smtp');
export const saveSMTPSettings = (data) => api.post('/settings/smtp', data);
export const testSMTPConnection = () => api.post('/settings/smtp/test');

// Email APIs
export const sendEmail = (data) => api.post('/emails/send', data);
export const generateEmail = (data) => api.post('/emails/generate', data);
export const getEmailHistory = () => api.get('/emails/history');
export const getLeadEmailHistory = (leadId) => api.get(`/emails/history/${leadId}`);

// Dashboard APIs
export const getDashboardStats = () => api.get('/dashboard/stats');

export default api;
