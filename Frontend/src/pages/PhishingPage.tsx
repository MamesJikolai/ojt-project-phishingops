import { useEffect, useState } from 'react'
import DefaultButton from '../components/DefaultButton'

// testing hash
const tempUser = [
    {
        id: 1,
        name: 'James Mikolai Salazar',
        email: 'jmsalazar@mymail.mapua.edu.ph',
        nameHash: '333ed8ce347a9e5c8d12912eb1d8f68e',
        time: '',
    },
]

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
    useEffect(() => {
        if (!previewTemplate) {
            localStorage.removeItem('userId')
        }
    }, [previewTemplate])

    // Change to DB later
    const [template] = useState(() => {
        if (previewTemplate) return previewTemplate

        const savedTemplate = localStorage.getItem('phishingTemplate')

        if (savedTemplate) {
            return JSON.parse(savedTemplate)
        }

        return {
            title: 'Wait! This was a Phishing Simulation',
            message1:
                "Don't worry, your data is safe. However, a real attacker could have used that link to access your personal details, address, and credit information.",
            message2:
                'Your security is a priority. Please follow the link below to complete your required phishing awareness module.',
            buttonText: 'Go to Training Portal',
        }
    })

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const userHash = params.get('id')
        const user = tempUser.find((u) => u.nameHash === userHash)

        if (user) {
            console.log(user.name, 'has clicked the link!')
        }
    }, [])

    // Change to DB later
    const handleNavigate = () => {
        window.location.href = '/home'
    }

    const displayTemplate = previewTemplate || template

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
