import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import SmallButton from '../SmallButton'
import type { Course } from '../../types/models'

interface CourseCardProps {
    item: Course
    customCSS?: string
    isDashboard?: boolean
    openEditModal?: () => void
    handleDeleteCourse?: () => void
    handlePublishCourse?: () => void
}

function CourseCard({
    item,
    customCSS,
    isDashboard,
    openEditModal,
    handleDeleteCourse,
    handlePublishCourse,
}: CourseCardProps) {
    // Grab the logged-in user directly from context
    const { user } = useAuth()
    const userRole = user?.role || ''
    const navigate = useNavigate()

    return (
        <div
            className={`flex flex-col bg-[#F8F9FA] w-[300px] rounded-2xl p-4 shrink-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 ${customCSS}`}
        >
            {!item.thumbnail ? (
                <div className="relative w-full h-[120px] rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3572A1] to-[#024C89]" />
                </div>
            ) : (
                <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-[120px] object-cover"
                />
            )}

            <div className="flex flex-col grow mt-3">
                <h3 className="text-[16px]">{item.title}</h3>
                <p className="text-[12px]">{item.caption}</p>
            </div>

            {userRole?.toLowerCase() !== 'hr' &&
                userRole?.toLowerCase() !== 'admin' && (
                    <SmallButton
                        onClick={() => navigate(`/courses/${item.id}`)}
                        className="text-[#F8F9FA] bg-[#024C89] hover:bg-[#3572A1]"
                    >
                        Start Lesson
                    </SmallButton>
                )}

            {userRole === 'admin' && !isDashboard && (
                <div>
                    <SmallButton
                        onClick={handlePublishCourse}
                        className={`${item.is_published ? 'border-2 border-[#DC3545] text-[#DC3545] hover:bg-[#DC3545] hover:text-[#F8F9FA]' : 'text-[#F8F9FA] bg-[#024C89] hover:bg-[#3572A1]'}`}
                    >
                        {item.is_published ? 'Unpublish' : 'Publish'}
                    </SmallButton>
                    <div className="flex flex-row gap-4">
                        <SmallButton
                            onClick={() => navigate(`/courses/${item.id}`)}
                            className="border-2 border-[#024C89] text-[#024C89] hover:bg-[#024C89] hover:text-[#F8F9FA]"
                        >
                            Edit
                        </SmallButton>
                        <SmallButton
                            onClick={handleDeleteCourse}
                            className="bg-[#DC3545] text-[#F8F9FA] hover:bg-[#FF6B6B]"
                        >
                            Delete
                        </SmallButton>
                    </div>
                </div>
            )}

            {(userRole === 'hr' || (userRole === 'admin' && isDashboard)) && (
                <div>
                    <SmallButton
                        onClick={() => navigate(`/courses/${item.id}`)}
                        className="bg-[#024C89] text-[#F8F9FA] hover:bg-[#3572A1]"
                    >
                        View
                    </SmallButton>
                </div>
            )}
        </div>
    )
}
export default CourseCard
