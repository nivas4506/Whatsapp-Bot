import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    LOG_LEVEL: z.string().default('info'),
    // Department Identity
    DEPARTMENT_NAME: z.string().default('Department of Computer Science & Engineering'),
    INSTITUTION_NAME: z.string().default('National Institute of Technology'),
    HOD_DISPLAY_NAME: z.string().default('Dr. A. Sharma (Head of Department)'),
    HOD_OFFICE_ROOM: z.string().default('Room 304, Academic Block A'),
    HOD_OFFICE_HOURS: z.string().default('Monday to Friday, 10:00 AM - 1:00 PM and 2:30 PM - 4:30 PM'),
    SUPPORT_HOURS_START: z.string().default('09:00'),
    SUPPORT_HOURS_END: z.string().default('17:00'),
    SUPPORT_DAYS: z.string().default('1,2,3,4,5'),
    // WhatsApp Meta Cloud API
    WHATSAPP_VERIFY_TOKEN: z.string().default('dev_hod_helpdesk_verify_token_2026'),
    WHATSAPP_API_TOKEN: z.string().default('mock_token'),
    WHATSAPP_PHONE_NUMBER_ID: z.string().default('109283746592837'),
    WHATSAPP_APP_SECRET: z.string().default('a1b2c3d4e5f60718293a4b5c6d7e8f90'),
    WHATSAPP_API_VERSION: z.string().default('v20.0'),
    WHATSAPP_MOCK_MODE: z.coerce.boolean().default(true),
    // Database
    DATABASE_URL: z.string().default('postgres://postgres:postgres@localhost:5432/whatsapp_helpdesk'),
    PGHOST: z.string().default('localhost'),
    PGPORT: z.coerce.number().default(5432),
    PGUSER: z.string().default('postgres'),
    PGPASSWORD: z.string().default('postgres'),
    PGDATABASE: z.string().default('whatsapp_helpdesk'),
    PGSSLMODE: z.string().default('disable'),
    PGPOOL_MAX: z.coerce.number().default(20),
    // Forms
    DEFAULT_GOOGLE_FORM_URL: z.string().url().default('https://forms.gle/universal-student-requirement-sample'),
    CERTIFICATE_FORM_URL: z.string().url().default('https://forms.gle/certificate-request-sample'),
    ATTENDANCE_FORM_URL: z.string().url().default('https://forms.gle/attendance-leave-sample'),
    APPOINTMENT_FORM_URL: z.string().url().default('https://forms.gle/hod-appointment-sample'),
    GRIEVANCE_FORM_URL: z.string().url().default('https://forms.gle/student-grievance-sample'),
    // Notifications
    HOD_NOTIFICATION_EMAIL: z.string().email().default('hod.cse@institution.edu'),
    ADMIN_NOTIFICATION_EMAIL: z.string().email().default('admin.cse@institution.edu'),
    NOTIFY_ON_ESCALATION: z.coerce.boolean().default(true),
    NOTIFY_ON_NEW_REQUIREMENT: z.coerce.boolean().default(true),
    // Metrics
    METRICS_ENABLED: z.coerce.boolean().default(true),
});
export const config = envSchema.parse(process.env);
