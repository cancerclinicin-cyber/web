import config from '../../configLoader';

// API Endpoints Constants
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${config.API_BASE_URL}/auth/login`,
  },

  // Admin endpoints
  ADMIN: {
    // Dashboard
    DASHBOARD_STATS: 'admin/dashboard/stats',
    DASHBOARD_MONTHLY_DATA: 'admin/dashboard/monthly_data',

    // Patients
    PATIENTS: 'admin/patients',

    // Appointments/Consultations
    CONSULTATIONS: 'admin/consultations',

    // Schedules
    SCHEDULES_ALL_DAYS: 'admin/schedules/all_days',
    SCHEDULE_TOGGLE_STATUS: (id: number) => `admin/schedules/${id}/toggle_status`,

    // Admin Settings
    ADMIN_SETTINGS: 'admin/admin_settings',
  },

  // Patient endpoints
  PATIENT: {
    // Patient Registration
    PATIENT_REGISTRATIONS: 'patients/patient_registrations',
    PATIENT_REGISTRATIONS_CHECK_SCHEDULE: (id: number) => `patients/patient_registrations/${id}/check_available_schedule`,

    // Appointments
    APPOINTMENTS: 'patients/appointments',
  },
} as const;

// Export individual endpoints for convenience
export const {
  AUTH,
  ADMIN,
  PATIENT,
} = API_ENDPOINTS;