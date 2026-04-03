import { useState, useEffect } from 'react'
import Message from '../../components/Message'
import TextInput from '../../components/TextInput'
import TextField from '../../components/TextField'
import DefaultButton from '../../components/DefaultButton'
import PhishingPage from '../PhishingPage'
import { apiService } from '../../services/userService'
import type { Landing } from '../../types/models'

function LandingPage() {
    const [title, setTitle] = useState('')
    const [message1, setMessage1] = useState('')
    const [message2, setMessage2] = useState('')
    const [buttonText, setButtonText] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true)
                const data = await apiService.getSingleton<Landing>('settings')

                setTitle(data.landing_title || '')
                setMessage1(data.landing_message1 || '')
                setMessage2(data.landing_message2 || '')
                setButtonText(data.landing_button_text || '')
            } catch (err) {
                console.error('Failed to load landing page content:', err)
                setError('Failed to load current settings.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [])

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (!title || !message1 || !buttonText) {
            setError('Fields are required!')
            return
        }

        const payload = {
            landing_title: title,
            landing_message1: message1,
            landing_message2: message2,
            landing_button_text: buttonText,
        }

        try {
            await apiService.updateSingleton('settings', payload)
            alert('Template saved to database!')
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

            <div className="flex justify-center gap-8 flex-wrap max-w-[100%]">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-2 bg-[#F8F9FA] w-150 h-fit px-[48px] py-[32px] rounded-xl drop-shadow-md"
                >
                    {error && (
                        <p className="text-[#DC3545] text-sm m-0">{error}</p>
                    )}
                    <TextInput
                        label="Title"
                        type="text"
                        placeholder="Landing Page Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full"
                    />
                    <TextField
                        label="Message 1"
                        placeholder="Message 1 Text"
                        value={message1}
                        onChange={(e) => setMessage1(e.target.value)}
                        required
                        className="w-full"
                        rows={5}
                    />
                    <TextField
                        label="Message 2"
                        placeholder="Message 2 Text"
                        value={message2}
                        onChange={(e) => setMessage2(e.target.value)}
                        className="w-full"
                        rows={5}
                    />
                    <TextInput
                        label="Button Text"
                        type="text"
                        placeholder="Button Text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
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
                            <PhishingPage
                                previewTemplate={{
                                    title,
                                    message1,
                                    message2,
                                    buttonText,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingPage
