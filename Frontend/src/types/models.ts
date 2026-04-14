export interface Accounts {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
    is_staff: boolean
    is_superuser: boolean
    date_joined: string
}

export interface Campaign {
    id: number
    name: string
    description: string
    status: 'draft' | 'paused' | 'running' | 'completed' | string
    email_template: number | null
    email_template_name: string
    assigned_course: number | null
    assigned_course_title: string
    smtp_host: string
    smtp_port: number // 587
    smtp_user: string
    smtp_password?: string
    smtp_use_tls: boolean // false
    smtp_use_ssl: boolean // false
    from_email: string
    scheduled_at: string | null
    created_at: string
    launched_at: string
    completed_at: string
    total_targets: number
    emails_sent: number
    links_clicked: number
    lms_completed: number
    click_rate: number
    targets: User[]
}

export interface Lesson {
    id: number
    title: string
    description: string
    video_file: string
    video_url: string
    video_source: string
    content_html: string
    order: number
    duration_minutes: number
}

export interface Course {
    id: number
    title: string
    caption: string
    description: string
    thumbnail: string
    is_published: boolean
    total_lessons: number
    has_quiz: true
    lessons: Lesson[]
    quiz: Quiz | QuizPublic | null
    created_at: string
    updated_at: string
}

export interface Quiz {
    id: number
    title: string
    passing_score: number
    max_attempts: number
    instructions: string
    total_questions: number
    questions: QuizQuestions[]
}

export interface QuizQuestions {
    id: number
    text: string
    question_type: 'single' | 'multi'
    order: number
    explanation: string
    choices: QuizChoices[]
}

export interface QuizChoices {
    id: number
    text: string
    is_correct: boolean
    order: number
}

export interface QuizPublic {
    id: number
    title: string
    passing_score: number
    max_attempts: number
    instructions: string
    total_questions: number
    questions: QuizQuestions[]
}

export interface QuizQuestionsPublic {
    id: number
    text: string
    question_type: 'single' | 'multi'
    order: number
    choices: QuizChoices[]
}

export interface QuizChoicesPublic {
    id: number
    text: string
    order: number
}

export interface EmailTemplate {
    id: number
    name: string
    subject: string
    sender_name: string
    body_html: string
    email_signature: string
    created_by?: number
    created_by_username?: string
    company_name: string
    created_at: string
    updated_at?: string
}

export interface User {
    id: number
    campaign: number
    campaign_name: string
    email: string
    full_name: string
    department: string
    position: string
    business_unit:
        | 'Ortigas'
        | 'Clark'
        | 'Pangasinan'
        | 'South Luzon'
        | 'Iloilo'
        | 'Proser'
    manager: string
    manager_email: string
    token: string
    phishing_link: string
    email_sent_at: string | null
    email_failed: boolean
    email_error: string | null
    link_clicked_at: string | null
    click_ip: string | null
    lms_started_at: string | null
    lms_completed_at: string | null
    quiz_score: number | null
}

export interface AuthUser {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_superuser: boolean
    role: string
    date_joined: string
}

export interface Landing {
    landing_title: string
    landing_message1: string
    landing_message2: string
    landing_button_text: string
    logo_url: string
    updated_at: string
}

export interface PlatformConfiguration {
    platform_name: string
    platform_base_url: string
    frontend_url: string
    default_from_name: string
    session_expiry_days: number
    allow_quiz_retake: boolean
}

export interface SMTPTest {
    smtp_host: string
    smtp_port: number
    smtp_user: string
    smtp_password: string
    smtp_use_tls: boolean
    smtp_use_ssl: boolean
    from_email: string
    to_email: string
}

export interface ManagerReminder {
    reminder_enabled: boolean
    reminder_days: number
    manager_notify_enabled: boolean
    reminder_from_name: string
    reminder_from_email: string
    reminder_smtp_host: string
    reminder_smtp_port: number
    reminder_smtp_user: string
    reminder_smtp_password: string
    reminder_smtp_use_tls: boolean
    reminder_smtp_use_ssl: boolean
    updated_at: string
}

export interface AnalyticsStats {
    total_campaigns: number
    total_sent: number
    total_clicked: number
    total_completed: number
    click_rate: number
    completion_rate: number
}

export interface AnalyticsResponse {
    summary: AnalyticsStats
    campaigns: any[]
    department_stats: any[]
    business_unit_stats: any[]
}

export interface DashboardStats {
    total_campaigns: number
    running_campaigns: number
    total_targets: number
    total_sent: number
    total_clicked: number
    total_completed: number
    click_rate: number
    completion_rate: number
    avg_quiz_score: number
}

export interface DashboardResponse {
    stats: DashboardStats
    recent_campaigns: Campaign[]
    recent_clicks: any[]
}
