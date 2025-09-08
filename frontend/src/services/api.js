import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== "undefined") {
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        document.cookie =
          "user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  post: (endpoint, data) => api.post(`/auth/${endpoint}`, data),
  get: (endpoint) => api.get(`/auth/${endpoint}`),
  put: (endpoint, data) => api.put(`/auth/${endpoint}`, data),
};

// Stations API
export const stationsApi = {
  getAll: (params = {}) => api.get("/stations", { params }),
  getById: (id) => api.get(`/stations/${id}`),
  create: (data) => api.post("/stations", data),
  update: (id, data) => api.put(`/stations/${id}`, data),
  delete: (id) => api.delete(`/stations/${id}`),
  search: (term) => api.get(`/stations/search/${term}`),
};

// Routes API
export const routesApi = {
  getAll: (params = {}) => api.get("/routes", { params }),
  getById: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post("/routes", data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
  getStations: (id) => api.get(`/routes/${id}/stations`),
  addStation: (id, data) => api.post(`/routes/${id}/stations`, data),
  removeStation: (id, stationId) =>
    api.delete(`/routes/${id}/stations/${stationId}`),
};

// Trains API
export const trainsApi = {
  getAll: (params = {}) => api.get("/trains", { params }),
  getById: (id) => api.get(`/trains/${id}`),
  create: (data) => api.post("/trains", data),
  update: (id, data) => api.put(`/trains/${id}`, data),
  delete: (id) => api.delete(`/trains/${id}`),
  getByRoute: (routeId) => api.get(`/trains/route/${routeId}`),
};

// Schedules API
export const schedulesApi = {
  getAll: (params = {}) => api.get("/schedules", { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post("/schedules", data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
  search: (params) => api.get("/schedules/search/routes", { params }),
  getByTrain: (trainId) => api.get(`/schedules/train/${trainId}`),
  updateStatus: (id, data) => api.put(`/schedules/${id}/status`, data),
};

// Reservations API
export const reservationsApi = {
  getAll: (params = {}) => api.get("/reservations", { params }),
  getById: (id) => api.get(`/reservations/${id}`),
  create: (data) => api.post("/reservations", data),
  update: (id, data) => api.put(`/reservations/${id}`, data),
  cancel: (id) => api.delete(`/reservations/${id}`), // Backend uses DELETE for cancel
  getByBookingRef: (bookingRef) =>
    api.get(`/reservations/booking/${bookingRef}`),
  getBySchedule: (scheduleId) =>
    api.get(`/reservations/schedule/${scheduleId}`),
  updateStatus: (id, data) => api.put(`/reservations/${id}/status`, data),
};

// Payments API
export const paymentsApi = {
  getAll: (params = {}) => api.get("/payments", { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post("/payments", data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  updateStatus: (id, data) => api.put(`/payments/${id}/status`, data),
  processRefund: (id, data) => api.post(`/payments/${id}/refund`, data),
  getByReservation: (reservationId) =>
    api.get(`/payments/reservation/${reservationId}`),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),
  getAllUsers: (params = {}) => api.get("/admin/users", { params }),
  getUserById: (id, params = {}) => api.get(`/admin/users/${id}`, { params }),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  getBookingReports: (params = {}) =>
    api.get("/admin/reports/bookings", { params }),
  getRevenueReports: (params = {}) =>
    api.get("/admin/reports/revenue", { params }),
  getTrainReports: (params = {}) =>
    api.get("/admin/reports/trains", { params }),
};

// Audit API - matches backend audit controller structure
export const auditApi = {
  // GET /api/audit/summary
  getSummary: (params = {}) => api.get("/audit/summary", { params }),

  // GET /api/audit/trains
  getTrainAudit: (params = {}) => api.get("/audit/trains", { params }),

  // GET /api/audit/trains/:id
  getTrainAuditById: (id, params = {}) =>
    api.get(`/audit/trains/${id}`, { params }),

  // GET /api/audit/schedules
  getScheduleAudit: (params = {}) => api.get("/audit/schedules", { params }),

  // GET /api/audit/schedules/:id
  getScheduleAuditById: (id, params = {}) =>
    api.get(`/audit/schedules/${id}`, { params }),

  // GET /api/audit/passengers
  getPassengerAudit: (params = {}) => api.get("/audit/passengers", { params }),

  // GET /api/audit/passengers/:id
  getPassengerAuditById: (id, params = {}) =>
    api.get(`/audit/passengers/${id}`, { params }),

  // GET /api/audit/payments
  getPaymentAudit: (params = {}) => api.get("/audit/payments", { params }),

  // GET /api/audit/payments/:id
  getPaymentAuditById: (id, params = {}) =>
    api.get(`/audit/payments/${id}`, { params }),

  // GET /api/audit/user/:userId
  getAuditByUser: (userId, params = {}) =>
    api.get(`/audit/user/${userId}`, { params }),

  // GET /api/audit/daterange
  getAuditByDateRange: (params = {}) => api.get("/audit/daterange", { params }),
};

export default api;
