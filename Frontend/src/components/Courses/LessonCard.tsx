import { useState } from 'react'
import type { Lesson } from '../../types/models'

interface LessonCardProps {
    item: Lesson
    index: number
    isOpen: boolean
    onToggle: () => void
}

function LessonCard({ item, index, isOpen, onToggle }: LessonCardProps) {
    return (
        <div className="bg-[#F8F9FA] rounded-xl px-8 py-6 w-full shadow-sm border border-gray-100">
            {/* Header (Always visible) */}
            <div
                className="flex flex-row justify-between items-center cursor-pointer"
                onClick={onToggle}
            >
                <h2>
                    Lesson {index + 1}: {item.title}
                </h2>
                <button className="text-[#024C89] font-bold text-xl px-3 py-1 rounded-md transition-colors">
                    {isOpen ? '⌃' : '˅'}
                </button>
            </div>

            {/* Content (Smoothly animates open and closed using CSS Grid) */}
            <div
                className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                        ? 'grid-rows-[1fr] opacity-100 mt-4'
                        : 'grid-rows-[0fr] opacity-0 mt-0'
                }`}
            >
                <div className="overflow-hidden">
                    <p className="text-gray-700 whitespace-pre-wrap">
                        {item.description}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LessonCard
