import { useState, useCallback } from 'react'
import DefaultButton from '../../components/DefaultButton'
import Message from '../../components/Message'
import TemplateModal from '../../components/TemplateModal'
import EmailTemplateCard from '../../components/EmailTemplateCard'

const emailTemplate = [
    {
        id: 1,
        name: 'TEST',
        author: 'IT Support',
        subject: 'Action Required: Your Password Expires in 24 Hours',
        body: 'Dear User,\n\nYour network password is set to expire in 24 hours. To avoid service disruption, please click the link below to sync your credentials.\n\n[Click Here to Update Password]\n\nThank you,\n\nIT Department',
        link: '',
        created: '03-16-26',
    },
    {
        id: 2,
        name: 'VPN_ACCESS',
        author: 'IT Helpdesk',
        subject: 'Urgent: VPN Access Verification Required',
        body: 'Dear User,\n\nWe detected a login attempt to the VPN from an unrecognized device. Please verify your access immediately to avoid temporary suspension.\n\n[Verify VPN Access]\n\nRegards,\n\nIT Helpdesk',
        link: '',
        created: '03-17-26',
    },
    {
        id: 3,
        name: 'MAILBOX_LIMIT',
        author: 'System Administrator',
        subject: 'Warning: Mailbox Storage Limit Reached',
        body: 'Dear User,\n\nYour mailbox has reached its storage limit. You may not be able to send or receive new messages.\n\nPlease click below to increase your storage quota.\n\n[Upgrade Mailbox]\n\nThank you,\n\nAdmin Team',
        link: '',
        created: '03-17-26',
    },
    {
        id: 4,
        name: 'SECURITY_ALERT',
        author: 'Security Team',
        subject: 'Security Alert: Suspicious Login Attempt Detected',
        body: 'Dear User,\n\nA suspicious login attempt was detected on your account. If this was not you, please secure your account immediately.\n\n[Secure My Account]\n\nStay safe,\n\nSecurity Team',
        link: '',
        created: '03-17-26',
    },
    {
        id: 5,
        name: 'ACCOUNT_UPDATE',
        author: 'HR Department',
        subject: 'Reminder: Update Your Employee Information',
        body: 'Dear Employee,\n\nOur records indicate that your profile information is incomplete or outdated. Please review and update your details as soon as possible.\n\n[Update Profile]\n\nBest regards,\n\nHR Department',
        link: '',
        created: '03-17-26',
    },
    {
        id: 6,
        name: 'PAYROLL_NOTICE',
        author: 'Finance Team',
        subject: 'Important: Payroll Issue Requires Your Attention',
        body: 'Dear Employee,\n\nWe encountered an issue processing your latest payroll. Kindly confirm your banking details to avoid delays.\n\n[Confirm Details]\n\nThank you,\n\nFinance Team',
        link: '',
        created: '03-17-26',
    },
]

export type Template = {
    id: number
    name: string
    author: string
    subject: string
    body: string
    link: string
    created: string
}

function Templates() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>(
        'create'
    )
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
        null
    )

    const openCreateModal = useCallback(() => {
        setModalMode('create')
        setSelectedTemplate(null)
        setIsModalOpen(true)
    }, [])

    const openViewModal = useCallback((templateData: Template) => {
        setModalMode('view')
        setSelectedTemplate(templateData)
        setIsModalOpen(true)
    }, [])

    const openEditModal = useCallback((templateData: Template) => {
        setModalMode('edit')
        setSelectedTemplate(templateData)
        setIsModalOpen(true)
    }, [])

    const handleSaveTemplate = () => {
        if (modalMode === 'edit') {
            //
        } else if (modalMode === 'create') {
            //
        }
    }

    const handleDeleteTemplate = (templateData: Template) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${templateData.name}"?`
        )
        if (confirmDelete) {
            //
        }
    }

    return (
        <div className="flex flex-col items-start m-8">
            <Message text="Templates" />

            <DefaultButton
                children="New Template"
                onClick={openCreateModal}
                className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA]"
            />

            <EmailTemplateCard
                emailTemplate={emailTemplate}
                openViewModal={openViewModal}
                openEditModal={openEditModal}
                handleDeleteTemplate={handleDeleteTemplate}
            />

            {isModalOpen && (
                <TemplateModal
                    key={
                        selectedTemplate ? selectedTemplate.id : 'create-modal'
                    }
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    mode={modalMode}
                    initialData={selectedTemplate}
                    onSave={handleSaveTemplate} // 3. Pass the function down to the modal!
                />
            )}
        </div>
    )
}

export default Templates
