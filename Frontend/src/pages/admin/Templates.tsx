import { useState, useEffect, useCallback } from 'react'
import DefaultButton from '../../components/DefaultButton'
import Message from '../../components/Message'
import TemplateModal from '../../components/Templates/TemplateModal'
import EmailTemplateCard from '../../components/Templates/EmailTemplateCard'
import type { EmailTemplate } from '../../types/models'
import { apiService } from '../../services/userService'

function Templates() {
    const [data, setData] = useState<EmailTemplate[]>([])
    const [loading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit'>(
        'create'
    )
    const [selectedTemplate, setSelectedTemplate] =
        useState<EmailTemplate | null>(null)

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                setIsLoading(true)
                const fetchedData =
                    await apiService.getAll<EmailTemplate>('emailTemplate')
                setData(fetchedData)
            } catch (err) {
                console.error('Failed to load templates:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchTemplate()
    }, [])

    const openCreateModal = useCallback(() => {
        setModalMode('create')
        setSelectedTemplate(null)
        setIsModalOpen(true)
    }, [])

    const openViewModal = useCallback((templateData: EmailTemplate) => {
        setModalMode('view')
        setSelectedTemplate(templateData)
        setIsModalOpen(true)
    }, [])

    const openEditModal = useCallback((templateData: EmailTemplate) => {
        setModalMode('edit')
        setSelectedTemplate(templateData)
        setIsModalOpen(true)
    }, [])

    const handleSaveTemplate = async (templateData: EmailTemplate) => {
        try {
            if (modalMode === 'edit') {
                const updatedTemplate = await apiService.update<EmailTemplate>(
                    'emailTemplate',
                    templateData.id,
                    templateData
                )

                setData((prev: EmailTemplate[]) =>
                    prev.map((item) =>
                        item.id === updatedTemplate.id ? updatedTemplate : item
                    )
                )
            } else if (modalMode === 'create') {
                const newTemplate = await apiService.create<EmailTemplate>(
                    'emailTemplate',
                    templateData
                )

                setData((prevData: EmailTemplate[]) => [
                    newTemplate,
                    ...prevData,
                ])
            }
        } catch (err) {
            console.error('Failed to save campaign:', err)
        }
    }

    const handleDeleteTemplate = useCallback(
        async (templateData: EmailTemplate) => {
            const confirmDelete = window.confirm(
                `Are you sure you want to delete "${templateData.name}"?`
            )
            if (confirmDelete) {
                try {
                    await apiService.delete('campaigns', templateData.id)

                    setData((prev: EmailTemplate[]) =>
                        prev.filter((item) => item.id !== templateData.id)
                    )
                } catch (err) {
                    console.error('Failed to delete campaign:', err)
                }
            }
        },
        [setData]
    )

    return (
        <div className="flex flex-col items-start m-8">
            <Message text="Templates" />

            <DefaultButton
                children="New Template"
                onClick={openCreateModal}
                className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA]"
            />

            <EmailTemplateCard
                emailTemplate={data}
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
