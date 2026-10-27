// JalNyaya - Centralized Frontend API Service
function getApiBase() {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/api';
  const trimmed = envUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const API_BASE = getApiBase();

function getAuthHeaders() {
  const token = localStorage.getItem('jalnyaya_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = getAuthHeaders();
  
  const config = {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('jalnyaya_token');
        localStorage.removeItem('jalnyaya_user');
        window.location.href = '/login';
      }
      throw new Error(data.message || 'An error occurred while communicating with the server.');
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request('/auth/me'),
  getRoles: () => request('/auth/roles'),

  // Public Transparency
  getPublicTransparency: () => request('/public/transparency'),

  // Analytics & Reports
  getStreetFairness: (status) => request(`/analytics/fairness${status ? `?status=${status}` : ''}`),
  getFewestDeliveries: () => request('/analytics/fewest-deliveries'),
  getPrioritySchedule: (zoneId) => request(`/analytics/priority-schedule${zoneId ? `?zone_id=${zoneId}` : ''}`),
  getOperatorDisputes: () => request('/analytics/operator-disputes'),
  recalculateFairness: () => request('/analytics/recalculate-fairness', { method: 'POST' }),
  getAdminDashboard: () => request('/analytics/dashboard/admin'),
  getResidentDashboard: () => request('/analytics/dashboard/resident'),
  getOperatorDashboard: () => request('/analytics/dashboard/operator'),

  // Streets
  getStreets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/streets${query ? `?${query}` : ''}`);
  },
  getStreetById: (id) => request(`/streets/${id}`),
  createStreet: (data) => request('/streets', { method: 'POST', body: JSON.stringify(data) }),
  updateStreet: (id, data) => request(`/streets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStreet: (id) => request(`/streets/${id}`, { method: 'DELETE' }),
  getZones: () => request('/streets/zones'),

  // Households
  getHouseholds: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/households${query ? `?${query}` : ''}`);
  },
  getHouseholdById: (id) => request(`/households/${id}`),
  createHousehold: (data) => request('/households', { method: 'POST', body: JSON.stringify(data) }),
  updateHousehold: (id, data) => request(`/households/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHousehold: (id) => request(`/households/${id}`, { method: 'DELETE' }),

  // Tankers
  getTankers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tankers${query ? `?${query}` : ''}`);
  },
  getTankerById: (id) => request(`/tankers/${id}`),
  createTanker: (data) => request('/tankers', { method: 'POST', body: JSON.stringify(data) }),
  updateTanker: (id, data) => request(`/tankers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTanker: (id) => request(`/tankers/${id}`, { method: 'DELETE' }),

  // Deliveries
  getDeliveries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/deliveries${query ? `?${query}` : ''}`);
  },
  getDeliveryById: (id) => request(`/deliveries/${id}`),
  createDelivery: (data) => request('/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  completeDeliveryTransaction: (id, data) => request(`/deliveries/${id}/complete`, { method: 'PUT', body: JSON.stringify(data) }),
  submitDeliveryConfirmation: (id, data) => request(`/deliveries/${id}/confirm`, { method: 'POST', body: JSON.stringify(data) }),
  cancelDelivery: (id, data) => request(`/deliveries/${id}/cancel`, { method: 'PUT', body: JSON.stringify(data) }),

  // Complaints & SLA
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/complaints${query ? `?${query}` : ''}`);
  },
  getComplaintById: (id) => request(`/complaints/${id}`),
  createComplaint: (data) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  assignOperator: (id, operatorId) => request(`/complaints/${id}/assign`, { method: 'PUT', body: JSON.stringify({ operator_id: operatorId }) }),
  resolveComplaint: (id) => request(`/complaints/${id}/resolve`, { method: 'PUT' }),
  getSlaReport: () => request('/complaints/sla-report'),

  // Water Sources
  getWaterSources: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/water-sources${query ? `?${query}` : ''}`);
  },
  getWaterSourceById: (id) => request(`/water-sources/${id}`),
  createWaterSource: (data) => request('/water-sources', { method: 'POST', body: JSON.stringify(data) }),
  updateWaterSource: (id, data) => request(`/water-sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addWaterReading: (id, levelLitres) => request(`/water-sources/${id}/readings`, { method: 'POST', body: JSON.stringify({ level_litres: levelLitres }) }),
  getWaterTrends: (sourceId) => request(`/water-sources/trends${sourceId ? `?source_id=${sourceId}` : ''}`),
  getAlerts: (resolved) => request(`/water-sources/alerts${resolved !== undefined ? `?resolved=${resolved}` : ''}`),
  resolveAlert: (id) => request(`/water-sources/alerts/${id}/resolve`, { method: 'PUT' }),

  // Payments
  getPayments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments${query ? `?${query}` : ''}`);
  },
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Users (Admin Only)
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ''}`);
  },
  getUserById: (id) => request(`/users/${id}`),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' })
};
