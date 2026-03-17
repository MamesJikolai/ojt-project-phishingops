import Message from '../../components/Message.tsx'
import CourseCard from '../../components/CourseCard.tsx'
import { courseList } from '../../assets/courses.ts'

function MyCourses() {
    return (
        <div className="flex flex-col items-start m-8">
            <Message text="My Courses" />

            {/* Cards Container */}
            <div className="flex flex-row flex-wrap justify-center gap-[32px]">
                {courseList.map((item, index) => (
                    <CourseCard
                        title={item.title}
                        caption={item.caption}
                        key={index}
                    />
                ))}
            </div>
        </div>
    )
}

export default MyCourses
