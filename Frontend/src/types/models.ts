export interface Accounts {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_superuser: boolean
    date_joined: string
}

export interface Campaign {
    id: number
    name: string
    description: string
    status: string
    email_template: number | null
    email_template_name: string | null
    assigned_course: number | null
    assigned_course_title: string | null
    from_email: string
    created_by_username: string | null
    total_targets: number
    emails_sent: number
    links_clicked: number
    lms_completed: number
    click_rate: number
    created_at: string
    launched_at: string | null
    completed_at: string | null
    scheduled_at: string | null
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
    quiz: string
    created_at: string
    updated_at: string
}

export interface EmailTemplate {
    id: number
    name: string
    subject: string
    sender_name: string // Django uses this instead of 'author'
    body_html: string // Django uses this instead of 'body'
    created_by?: number // The user ID (read-only from Django)
    created_by_username?: string // The username (read-only from Django)
    created_at: string // Django uses this instead of 'created'
    updated_at?: string
    // Note: I removed 'link' because it is not in your Django EmailTemplate model.
    // Usually, the phishing link is injected dynamically when a Campaign is launched.
}

export interface User {
    id: number
    campaign: string
    campaign_name: string
    email: string
    full_name: string
    department: string
    position: string
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
    role?: string
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
