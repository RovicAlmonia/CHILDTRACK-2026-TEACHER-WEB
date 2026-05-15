const API = axios.create({
  baseURL: import.meta.env?.VITE_API_URL ?? 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': 'true',  // ← add this
  },
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('ct_token');
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
    return config;
});
API.interceptors.response.use((r) => r, (err) => {
    if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
    }
    return Promise.reject(err);
});
export default API;
// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
    login: (username, password) => API.post('/auth/login', { username, password }),
    register: (data) => API.post('/auth/register', data),
};
// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
    getAll: (date) => API.get('/attendance', { params: date ? { date } : {} }),
    create: (data) => API.post('/attendance', data),
    update: (id, data) => API.patch(`/attendance/${id}`, data),
    remove: (id) => API.delete(`/attendance/${id}`),
};
// ─── Students ─────────────────────────────────────────────────────────────────
export const studentsAPI = {
    getAll: () => API.get('/students'),
    getById: (id) => API.get(`/students/${id}`),
    create: (data) => API.post('/students', data),
};
// ─── Guardians ────────────────────────────────────────────────────────────────
export const guardiansAPI = {
    getAll: (student_name) => API.get('/guardians', { params: student_name ? { student_name } : {} }),
    create: (data) => API.post('/guardians', data),
};
// ─── Scan Photos ──────────────────────────────────────────────────────────────
export const scanPhotosAPI = {
    getAll: (student_name) => API.get('/scan-photos', {
        params: student_name ? { student_name } : {},
    }),
    upload: (data) => API.post('/scan-photos', data),
};
// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsAPI = {
    getAll: () => API.get('/events'),
    getOne: (id) => API.get(`/events/${id}`),
    create: (data) => API.post('/events', data),
    update: (id, data) => API.patch(`/events/${id}`, data),
    remove: (id) => API.delete(`/events/${id}`),
};
// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsAPI = {
    /** GET /api/notifications — attendance_notifications VIEW */
    getAll: (params) => API.get('/notifications', { params }),
    /** GET /api/notifications/summary */
    getSummary: () => API.get('/notifications/summary'),
    /** GET /api/notifications/persistent */
    getPersistent: (params) => API.get('/notifications/persistent', { params }),
    /** PATCH /api/notifications/persistent/:id/read */
    markRead: (id) => API.patch(`/notifications/persistent/${id}/read`),
    /** PATCH /api/notifications/persistent/read-all */
    markAllRead: (teacher_id) => API.patch('/notifications/persistent/read-all', teacher_id ? { teacher_id } : {}),
};
export const absenceReasonsAPI = {
    getAll: (params) => API.get('/absence-reasons', { params }),
    update: (id, data) => API.patch(`/absence-reasons/${id}/status`, data), // ← /status added
};
// ─── Schedules (Teacher Dashboard) ───────────────────────────
export const schedulesAPI = {
    getByTeacher: (teacher_id) => API.get('/student-schedules', { params: { teacher_id } }),
    create: (data) => API.post('/student-schedules', data),
    update: (id, data) => API.patch(`/student-schedules/${id}`, data),
    delete: (id) => API.delete(`/student-schedules/${id}`),
};
