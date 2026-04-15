import { useState, useEffect, useRef } from 'react'
import Message from '../../components/Message'
import TextInput from '../../components/TextInput'
import TextField from '../../components/TextField'
import DefaultButton from '../../components/DefaultButton'
import PhishingPage from '../PhishingPage'
import { apiService } from '../../services/userService'
import type { Landing } from '../../types/models'

function LandingPage() {
    const [landingPageData, setLandingPageData] = useState<Landing>({
        landing_title: '',
        landing_message1: '',
        landing_message2: '',
        landing_button_text: '',
        logo: '',
        updated_at: '',
    })
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [fileInputKey, setFileInputKey] = useState(Date.now())
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true)
                const data = await apiService.getSingleton<Landing>('settings')

                setLandingPageData(data)
            } catch (err) {
                console.error('Failed to load landing page content:', err)
                setError('Failed to load current settings.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [])

    const handleLandingChange = (
        e:
            | React.ChangeEvent<HTMLInputElement>
            | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target
        setLandingPageData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0])

            const localUrl = URL.createObjectURL(e.target.files[0])
            setLandingPageData((prev) => ({ ...prev, logo: localUrl }))
        }
    }

    const handleRemoveLogo = async () => {
        if (logoFile) {
            setLogoFile(null)
            setLandingPageData((prev) => ({ ...prev, logo: '', logo_url: '' }))
            setFileInputKey(Date.now())

            return
        }

        try {
            await apiService.deleteFile('settings/upload-logo')

            // Clear local state
            setLogoFile(null)
            setLandingPageData((prev) => ({
                ...prev,
                logo: '',
                logo_url: '',
            }))
            setFileInputKey(Date.now())

            alert('Logo removed successfully!')
        } catch (err) {
            console.error('Failed to remove logo:', err)
            setError('Failed to remove logo from the database.')
        }
    }

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (
            !landingPageData.landing_title ||
            !landingPageData.landing_message1 ||
            !landingPageData.landing_button_text
        ) {
            setError('Fields are required!')
            return
        }

        try {
            const textPayload = {
                landing_title: landingPageData.landing_title,
                landing_message1: landingPageData.landing_message1,
                landing_message2: landingPageData.landing_message2,
                landing_button_text: landingPageData.landing_button_text,
            }

            await apiService.updateSingleton('settings', textPayload)

            if (logoFile) {
                const formData = new FormData()
                formData.append('logo', logoFile)

                await apiService.uploadFile('settings/upload-logo/', formData)
            }

            alert('Template saved to database!')
            setLogoFile(null)
        } catch (err) {
            console.error('Failed to save template:', err)
            setError('Failed to save template to the database.')
        }
    }

    if (isLoading) {
        return (
            <div className="m-8 animate-pulse text-gray-500">
                Loading editor...
            </div>
        )
    }

    return (
        <div className="flex flex-col items-start p-4 md:p-8 w-full box-border">
            <Message text="Landing Page Content" />

            <div className="flex justify-center gap-8 flex-wrap w-full">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-2 bg-[#F8F9FA] w-full max-w-150 h-fit px-12 py-8 rounded-xl drop-shadow-md"
                >
                    {error && (
                        <p className="text-[#DC3545] text-sm m-0">{error}</p>
                    )}
                    <TextInput
                        label="Title"
                        type="text"
                        name="landing_title"
                        placeholder="Landing Page Title"
                        value={landingPageData.landing_title}
                        onChange={handleLandingChange}
                        required
                        className="w-full"
                    />
                    <div className="flex flex-col md:flex-row md:items-end gap-y-2 w-full">
                        <TextInput
                            label="Logo"
                            type="file"
                            accept="image/png, image/jpeg, image/webp, .png, .jpg, .jpeg, .webp"
                            onChange={handleFileChange}
                            key={fileInputKey}
                        />
                        {landingPageData.logo && (
                            <DefaultButton
                                children="Delete Logo"
                                type="button"
                                onClick={handleRemoveLogo}
                                className="w-full md:w-fit whitespace-nowrap bg-[#DC3545] hover:bg-[#FF6B6B] text-[#F8F9FA] px-2! py-1!"
                            />
                        )}
                    </div>
                    <TextField
                        label="Message 1"
                        name="landing_message1"
                        placeholder="Message 1 Text"
                        value={landingPageData.landing_message1}
                        onChange={handleLandingChange}
                        required
                        className="w-full"
                        rows={5}
                    />
                    <TextField
                        label="Message 2"
                        name="landing_message2"
                        placeholder="Message 2 Text"
                        value={landingPageData.landing_message2}
                        onChange={handleLandingChange}
                        className="w-full"
                        rows={5}
                    />
                    <TextInput
                        label="Button Text"
                        type="text"
                        name="landing_button_text"
                        placeholder="Button Text"
                        value={landingPageData.landing_button_text}
                        onChange={handleLandingChange}
                        required
                        className="w-full"
                    />
                    <DefaultButton
                        type="submit"
                        className="w-full bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                    >
                        Save
                    </DefaultButton>
                </form>

                <div>
                    <h3>Preview</h3>
                    <div className="bg-[#F8F9FA] w-[360px] h-[600px] md:w-[600px] md:h-[360px] rounded-xl drop-shadow-md overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-[514px] h-[857px] md:w-[857px] md:h-[514px] px-8 origin-top-left scale-[0.7]">
                            <PhishingPage previewTemplate={landingPageData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingPage
