import type { EmailTemplate } from '../../types/models'
import DefaultButton from '../DefaultButton'

interface EmailTemplateCardProps {
    emailTemplate: EmailTemplate[]
    openViewModal: (templateData: EmailTemplate) => void
    openEditModal: (templateData: EmailTemplate) => void
    handleDeleteTemplate: (templateData: EmailTemplate) => void
}

function EmailTemplateCard({
    emailTemplate,
    openViewModal,
    openEditModal,
    handleDeleteTemplate,
}: EmailTemplateCardProps) {
    return (
        <div className="flex flex-row flex-wrap justify-evenly gap-y-4 lg:gap-y-8 mx-auto w-full">
            {emailTemplate.map((item, index) => (
                <div
                    key={index}
                    className="flex flex-col gap-2 bg-[#F8F9FA] w-full max-w-100 px-4 sm:px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 drop-shadow-md"
                >
                    <div className="flex flex-col gap-2 pb-2 border-b-2 border-[#DDE2E5] grow">
                        <h3>{item.name}</h3>
                        <p className="text-[12px]">
                            From:{' '}
                            <span className="font-bold">
                                {item.sender_name}
                            </span>
                        </p>
                        <p className="text-[12px]">
                            Created By:{' '}
                            <span className="font-bold">
                                {item.created_by_username}
                            </span>
                        </p>
                        <div className="bg-[#DDE2E5] text-[14px] grow w-full px-4 py-2 rounded-xl">
                            <p className="font-bold">{item.subject}</p>
                            <br />
                            <p className="whitespace-pre-wrap">
                                {item.body_html}
                            </p>
                        </div>
                        <p className="text-[12px]">
                            Created{' '}
                            {new Date(item.created_at).toLocaleDateString()}
                        </p>
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
