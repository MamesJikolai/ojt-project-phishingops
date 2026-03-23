import { useState, useEffect } from 'react'
import DefaultButton from '../components/DefaultButton'
import { apiService } from '../services/userService' // Added import
import type { Landing } from '../types/models'

interface TemplateProps {
    title: string
    message1: string
    message2: string
    buttonText: string
}

function PhishingPage({
    previewTemplate,
}: {
    previewTemplate?: TemplateProps
}) {
    const [template, setTemplate] = useState<TemplateProps | null>(null)
    const [isLoading, setIsLoading] = useState(!previewTemplate)

    useEffect(() => {
        // If we are just previewing it in the admin panel, don't fetch from DB
        if (previewTemplate) return

        const fetchTemplate = async () => {
            try {
                const data = await apiService.getSingleton<Landing>('settings')
                setTemplate({
                    title: data.landing_title,
                    message1: data.landing_message1,
                    message2: data.landing_message2,
                    buttonText: data.landing_button_text,
                })
            } catch (err) {
                console.error('Failed to fetch phishing template', err)
                // Safe fallback in case the API is down
                setTemplate({
                    title: 'Wait! This was a Phishing Simulation',
                    message1:
                        "Don't worry, your data is safe. However, a real attacker could have used that link to access your personal details, address, and credit information.",
                    message2:
                        'Your security is a priority. Please follow the link below to complete your required phishing awareness module.',
                    buttonText: 'Go to Training Portal',
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchTemplate()
    }, [previewTemplate])

    const handleNavigate = () => {
        window.location.href = '/home' // Update to your actual training portal URL
    }

    const displayTemplate = previewTemplate || template

    if (isLoading || !displayTemplate) {
        return (
            <div className="h-screen flex items-center justify-center text-gray-500">
                Loading...
            </div>
        )
    }

    return (
        <div
            className={`flex flex-col justify-center items-center gap-4 bg-[#F8F9FA] px-4 text-center ${
                previewTemplate ? 'h-full' : 'h-screen'
            }`}
        >
            <h1>{displayTemplate.title}</h1>
            <p>{displayTemplate.message1}</p>
            {displayTemplate.message2 && (
                <p className="text-sm">{displayTemplate.message2}</p>
            )}
            <DefaultButton
                children={displayTemplate.buttonText}
                onClick={handleNavigate}
                className="text-[#FFFAFA] bg-[#024C89] hover:bg-[#3572A1]"
            />
        </div>
    )
}

export default PhishingPage
