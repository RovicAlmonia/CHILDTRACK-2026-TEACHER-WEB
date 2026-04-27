import axios from 'axios';

const API = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000/api',
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ct_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name:      string;
  username:  string;
  password:  string;
  age?:      number;
  gender?:   string;
  section?:  string;
  contact?:  string;
  address?:  string;
}

export interface AttendancePayload {
  student_name:   string;
  lrn?:           string;
  gender?:        string;
  guardian_name?: string;
  by_whom?:       string;
  status:         string;
  session?:       string;
  date:           string;
  qr_data?:       string;
}

export interface StudentPayload {
  lrn:    string;
  name:   string;
  gender: string;
  parents_guardians?: { role: string; name: string; contact_number?: string }[];
}

export interface GuardianPayload {
  name:          string;
  age?:          number;
  address?:      string;
  relationship?: string;
  contact?:      string;
  student_name:  string;
  photo_base64?: string;
}

export interface ScanPhotoPayload {
  student_name:  string;
  status?:       string;
  photo_base64:  string;
}

export interface ScanPhoto {
  id:           number;
  student_name: string;
  status:       string | null;
  photo_path:   string;
  captured_at:  string;
}

export interface EventPayload {
  title:         string;
  description?:  string;
  event_type?:   string;
  scheduled_at:  string;   // ISO datetime  e.g. "2026-04-20T09:00:00"
  location?:     string;
  teacher_name?: string;
  teacher_id?:   number;
}

export interface Event {
  id:           number;
  teacher_id:   number | null;
  title:        string;
  description:  string | null;
  event_type:   string | null;
  scheduled_at: string;
  location:     string | null;
  teacher_name: string | null;
  created_at:   string;
}

/**
 * Row returned by GET /api/notifications
 * Sourced from the `attendance_notifications` VIEW.
 *
 * No JOIN needed — attendance table already stores student_name directly.
 * All columns from attendance are exposed; `timestamp` is aliased
 * to `created_at` inside the VIEW definition.
 *
 * Matches attendance table columns:
 *   id, teacher_id, student_name, lrn, gender, guardian_name,
 *   by_whom, status, session, date, created_at (← timestamp),
 *   qr_data, pickup_time, pickup_by
 */
export interface AttendanceNotification {
  id:            number;
  teacher_id:    number | null;
  student_name:  string | null;
  lrn:           string | null;
  gender:        string | null;
  guardian_name: string | null;
  by_whom:       string | null;
  status:        string;
  session:       string | null;
  date:          string;          // YYYY-MM-DD
  created_at:    string;          // aliased from attendance.timestamp in VIEW
  qr_data:       string | null;
  pickup_time:   string | null;
  pickup_by:     string | null;
}

/** Summary returned by GET /api/notifications/summary */
export interface NotificationsSummary {
  date:    string;
  total:   number;
  present: number;
  late:    number;
  absent:  number;
  dropoff: number;
  pickup:  number;
}

/**
 * Row returned by GET /api/notifications/persistent
 * Sourced from the `notifications` table.
 */
export interface PersistentNotification {
  id:           number;
  teacher_id:   number | null;
  student_id:   number | null;
  type:         'attendance' | 'event' | 'system';
  title:        string;
  message:      string | null;
  reference_id: number | null;
  is_read:      0 | 1;
  created_at:   string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (username: string, password: string) =>
    API.post('/auth/login', { username, password }),
  register: (data: RegisterPayload) =>
    API.post('/auth/register', data),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
  getAll:  (date?: string) =>
    API.get('/attendance', { params: date ? { date } : {} }),
  create:  (data: AttendancePayload) =>
    API.post('/attendance', data),
  update:  (id: number, data: Partial<AttendancePayload>) =>
    API.patch(`/attendance/${id}`, data),
  remove:  (id: number) =>
    API.delete(`/attendance/${id}`),
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentsAPI = {
  getAll:  () => API.get('/students'),
  getById: (id: number) => API.get(`/students/${id}`),
  create:  (data: StudentPayload) => API.post('/students', data),
};

// ─── Guardians ────────────────────────────────────────────────────────────────
export const guardiansAPI = {
  getAll:  (student_name?: string) =>
    API.get('/guardians', { params: student_name ? { student_name } : {} }),
  create:  (data: GuardianPayload) =>
    API.post('/guardians', data),
};

// ─── Scan Photos ──────────────────────────────────────────────────────────────
export const scanPhotosAPI = {
  getAll: (student_name?: string) =>
    API.get<ScanPhoto[]>('/scan-photos', {
      params: student_name ? { student_name } : {},
    }),
  upload: (data: ScanPhotoPayload) =>
    API.post<{ message: string; path: string }>('/scan-photos', data),
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const eventsAPI = {
  getAll:  ()                                        => API.get<Event[]>('/events'),
  getOne:  (id: number)                              => API.get<Event>(`/events/${id}`),
  create:  (data: EventPayload)                      => API.post<Event>('/events', data),
  update:  (id: number, data: Partial<EventPayload>) => API.patch<Event>(`/events/${id}`, data),
  remove:  (id: number)                              => API.delete(`/events/${id}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsAPI = {
  /** GET /api/notifications — attendance_notifications VIEW */
  getAll: (params?: {
    date?:   string;
    status?: string;
    search?: string;
    limit?:  number;
    offset?: number;
  }) => API.get<AttendanceNotification[]>('/notifications', { params }),

  /** GET /api/notifications/summary */
  getSummary: () =>
    API.get<NotificationsSummary>('/notifications/summary'),

  /** GET /api/notifications/persistent */
  getPersistent: (params?: {
    teacher_id?: number;
    is_read?:    0 | 1;
    type?:       'attendance' | 'event' | 'system';
    limit?:      number;
    offset?:     number;
  }) => API.get<PersistentNotification[]>('/notifications/persistent', { params }),

  /** PATCH /api/notifications/persistent/:id/read */
  markRead: (id: number) =>
    API.patch(`/notifications/persistent/${id}/read`),

  /** PATCH /api/notifications/persistent/read-all */
  markAllRead: (teacher_id?: number) =>
    API.patch('/notifications/persistent/read-all', teacher_id ? { teacher_id } : {}),
};

// ─── Absence Reasons ──────────────────────────────────────────────────────────
export interface AbsenceReason {
  id:             number;
  teacher_id:     number | null;
  student_name:   string;
  lrn:            string | null;
  reason:         string;
  date:           string;
  submitted_by:   string | null;
  parent_contact: string | null;
  status:         'pending' | 'approved' | 'rejected';
  created_at:     string;
}

export const absenceReasonsAPI = {
  getAll: (params?: { student_name?: string; date?: string; status?: string }) =>
    API.get<AbsenceReason[]>('/absence-reasons', { params }),
  update: (id: number, data: { status: string }) =>
    API.patch<AbsenceReason>(`/absence-reasons/${id}/status`, data), // ← /status added
};

// ─── Schedules (Teacher Dashboard) ───────────────────────────
export const schedulesAPI = {
  getByTeacher: (teacher_id: number) =>
    API.get('/student-schedules', { params: { teacher_id } }),

  create: (data: any) =>
    API.post('/student-schedules', data),

  update: (id: number, data: any) =>
    API.patch(`/student-schedules/${id}`, data),

  delete: (id: number) =>
    API.delete(`/student-schedules/${id}`),
};