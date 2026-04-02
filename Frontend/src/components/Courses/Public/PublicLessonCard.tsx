import { Icons } from '../../../assets/icons'
import type { Lesson } from '../../../types/models'
import { getEmbedUrl } from '../../../utils/getEmbedUrl'
import { useState, useEffect, useRef } from 'react'
import LessonVideoPlayer from '../LessonVideoPlayer'
import DOMPurify from 'dompurify'

interface PublicLessonCardProps {
    item: Lesson
    index: number
    isOpen: boolean
    onToggle: () => void
    onLessonCompleted?: (lessonId: number) => void
}

function PublicLessonCard({
    item,
    index,
    isOpen,
    onToggle,
    onLessonCompleted,
}: PublicLessonCardProps) {
    const embedUrl = getEmbedUrl(item.video_url)

    const [videoCompleted, setVideoCompleted] = useState(false)
    const [contentCompleted, setContentCompleted] = useState(false)
    const contentEndRef = useRef<HTMLDivElement>(null)

    const hasVideo = Boolean(embedUrl && embedUrl.trim() !== '')
    const hasContent = Boolean(
        item.content_html && item.content_html.trim() !== ''
    )
    const [isReported, setIsReported] = useState(false)

    // Track when user scrolls to the bottom of the text content
    useEffect(() => {
        if (!hasContent) {
            setContentCompleted(true) // Auto-complete if there is no text content
            return
        }

        // Only track when the lesson is open
        if (isOpen && contentEndRef.current) {
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting) {
                        setContentCompleted(true)
                        observer.disconnect() // Stop observing once reached
                    }
                },
                { threshold: 0.1 }
            )
            observer.observe(contentEndRef.current)
            return () => observer.disconnect()
        }
    }, [hasContent, isOpen])

    // Trigger the completion callback when requirements are met
    useEffect(() => {
        if (item.id && !isReported) {
            const isVideoDone = hasVideo ? videoCompleted : true
            const isContentDone = hasContent ? contentCompleted : true

            if (isVideoDone && isContentDone && onLessonCompleted) {
                onLessonCompleted(item.id)
                setIsReported(true)
            }
        }
    }, [
        videoCompleted,
        contentCompleted,
        hasVideo,
        hasContent,
        item.id,
        onLessonCompleted,
    ])

    const formatHtmlContent = (rawHtml: string | null | undefined) => {
        if (!rawHtml) return ''

        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
        const parsedHtml = rawHtml.replace(linkRegex, (match, text, url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-medium">${text}</a>`
        })

        // Scrub the HTML clean of any malicious scripts before returning it
        return DOMPurify.sanitize(parsedHtml)
    }

    return (
        <div className="bg-[#F8F9FA] rounded-xl px-8 py-6 w-full shadow-sm border border-gray-100">
            {/* Lesson Header */}
            <div
                onClick={onToggle}
                className="flex flex-row justify-between items-center cursor-pointer"
            >
                <h2 onClick={onToggle}>
                    Lesson {index + 1}: {item.title}
                </h2>

                <img
                    src={isOpen ? Icons.iconCollapse : Icons.iconExpand}
                    onClick={onToggle}
                    className="w-[24px] h-[24px]"
                />
            </div>

            {/* Lesson Contents */}
            <div
                className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                        ? 'grid-rows-[1fr] opacity-100 mt-4'
                        : 'grid-rows-[0fr] opacity-0 mt-0'
                }`}
            >
                <div className="flex flex-col gap-4 overflow-hidden">
                    {/* Lesson Description */}
                    <p className="text-gray-700 whitespace-pre-wrap">
                        {item.description}
                    </p>

                    {/* Embedded Video */}
                    {(embedUrl || embedUrl.trim() !== '') && (
                        <LessonVideoPlayer
                            url={embedUrl}
                            onMilestoneReached={() => setVideoCompleted(true)}
                        />
                    )}

                    {/* Additional Lesson Content */}
                    {hasContent && (
                        <div
                            className="flex flex-col gap-3"
                            dangerouslySetInnerHTML={{
                                __html: formatHtmlContent(item.content_html),
                            }}
                        />
                    )}

                    {hasContent && (
                        <div ref={contentEndRef} className="h-1 w-full" />
                    )}
                </div>
            </div>
        </div>
    )
}

export default PublicLessonCard
