import { useState } from 'react'
import Message from '../../components/Message'
import TextInput from '../../components/TextInput'
import TextField from '../../components/TextField'
import DefaultButton from '../../components/DefaultButton'
import PhishingPage from '../PhishingPage'

function LandingPage() {
    // Change to DB later
    const [template] = useState(() => {
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

    const [title, setTitle] = useState(template.title)
    const [message1, setMessage1] = useState(template.message1)
    const [message2, setMessage2] = useState(template.message2)
    const [buttonText, setButtonText] = useState(template.buttonText)
    const [error, setError] = useState('')

    const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (!title || !message1 || !buttonText) {
            setError('Fields are required!')
            return
        }

        const templateData = {
            title,
            message1,
            message2,
            buttonText,
        }

        // Change to DB later
        localStorage.setItem('phishingTemplate', JSON.stringify(templateData))

        alert('Template saved!')
    }

    return (
        <>
            <div className="flex flex-col items-start m-8">
                <Message text="Landing Page Content" />
            </div>

            <div className="flex justify-center gap-8 flex-wrap">
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-[8px] bg-[#F8F9FA] w-[600px] h-fit max-h-[90vh] px-[48px] py-[32px] rounded-xl drop-shadow-md"
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
                    <DefaultButton type="submit" className="self-center mt-4">
                        Save
                    </DefaultButton>
                </form>

                <div>
                    <h3>Preview</h3>
                    <div className="bg-[#F8F9FA] w-[600px] h-[360px] rounded-xl drop-shadow-md overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-[857px] h-[514px] px-8 origin-top-left scale-[0.7]">
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
        </>
    )
}

export default LandingPage
