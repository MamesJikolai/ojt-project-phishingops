export interface Accounts {
    id: number
    username: string
    password: string
    role: string
    firstName: string
    lastName: string
    email: string
    organization: string
    created: string
}

export interface Campaign {
    id: number
    name: string
    status: string
    target: string
    date: string
    completion: number
    template: string
}

export interface Lesson {
    id: number
    title: string
    duration: string
    videoUrl: string
}

export interface Course {
    id: number
    title: string
    caption: string
    description: string
    totalLessons: number
    thumbnailL: string
    creaetedAt: string
    updatedAt: string
    published: boolean
    lessons: Lesson[]
}

export interface EmailTemplate {
    id: number
    name: string
    author: string
    subject: string
    body: string
    link: string
    created: string
}

export interface User {
    id: number
    name: string
    email: string
    department: string
    campaign: string
    status: string
    clicked: string
    training: string
    score: number
}
