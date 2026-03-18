import type { Template } from '../pages/admin/Templates'
import DefaultButton from './DefaultButton'

interface EmailTemplateCardProps {
    emailTemplate: Template[]
    openViewModal: (templateData: Template) => void
    openEditModal: (templateData: Template) => void
    handleDeleteTemplate: (templateData: Template) => void
}

function EmailTemplateCard({
    emailTemplate,
    openViewModal,
    openEditModal,
    handleDeleteTemplate,
}: EmailTemplateCardProps) {
    return (
        <div className="flex flex-row flex-wrap justify-center items-start gap-8 mt-8 mx-auto">
            {emailTemplate.map((item, index) => (
                <div
                    key={index}
                    className="flex flex-col gap-2 bg-[#F8F9FA] px-8 py-4 rounded-xl drop-shadow-md"
                >
                    <div className="flex flex-col gap-2 pb-2 border-b-2 border-[#DDE2E5]">
                        <h3>{item.name}</h3>
                        <p className="text-[12px]">
                            From:{' '}
                            <span className="font-bold">{item.author}</span>
                        </p>
                        <div className="bg-[#DDE2E5] text-[14px] h-fit w-[400px] px-4 py-2 rounded-xl">
                            <p>{item.subject}</p>
                            <br />
                            <p className="whitespace-pre-wrap">{item.body}</p>
                        </div>
                        <p className="text-[12px]">Created {item.created}</p>
                    </div>
                    <div className="flex flex-row justify-around text-[12px]">
                        <DefaultButton
                            children="View"
                            className="text-[#17A2B8] hover:text-[#4ECFE0] font-bold"
                            onClick={() => openViewModal(item)}
                        />
                        <DefaultButton
                            children="Edit"
                            className="text-[#28A745] hover:text-[#45C664] font-bold"
                            onClick={() => openEditModal(item)}
                        />
                        <DefaultButton
                            children="Delete"
                            className="text-[#DC3545] hover:text-[#FF6B6B] font-bold"
                            onClick={() => handleDeleteTemplate(item)}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default EmailTemplateCard
