import Message from '../../components/Message.tsx'
import CourseCard from '../../components/CourseCard.tsx'
import { courseList } from '../../assets/courses.ts'

function Courses() {
    return (
        <div className="flex flex-col items-start m-8">
            <Message text="Courses" />

            {/* Cards Container */}
            <div className="flex flex-row flex-wrap justify-center gap-[32px] drop-shadow-md">
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

export default Courses
