import Message from '../../components/Message.tsx'
import CourseCard from '../../components/CourseCard.tsx'
import { courseList } from '../../assets/courses.ts'
import { Icons } from '../../assets/icons.ts'
import { NavLink } from 'react-router-dom'

function Home() {
    return (
        <>
            <div className="flex flex-col items-start p-8 overflow-x-hidden max-w-full min-h-screen">
                <div className="flex flex-row">
                    <NavLink to="/home" className="h-fit">
                        {({ isActive }) => (
                            <img
                                src={
                                    isActive && Icons.homeActive
                                        ? Icons.homeActive
                                        : Icons.home
                                }
                                alt="Home"
                                className="w-8 h-8 mr-6"
                            />
                        )}
                    </NavLink>

                    <Message text=" / Home" />
                </div>

                <div className="flex flex-row flex-wrap justify-center gap-[16px]">
                    {courseList.map((item, index) => (
                        <CourseCard
                            title={item.title}
                            caption={item.caption}
                            key={index}
                            customCSS="drop-shadow-md"
                        />
                    ))}
                </div>
            </div>
        </>
    )
}

export default Home
