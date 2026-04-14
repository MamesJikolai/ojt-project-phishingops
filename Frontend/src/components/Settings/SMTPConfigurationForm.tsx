import { useState } from 'react'
import DefaultButton from '../DefaultButton'
import TextInput from '../TextInput'
import type { SMTPTest } from '../../types/models'
import { apiService } from '../../services/userService'

interface SMTPConfigurationFormProps {
    mode?: 'campaign'
}

const initialConfig: SMTPTest = {
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    to_email: '',
    smtp_use_ssl: false,
    smtp_use_tls: true,
}

function SMTPConfigurationForm({ mode }: SMTPConfigurationFormProps) {
    const [smtpConfig, setSmtpConfig] = useState<SMTPTest>(initialConfig)
    const [smtpError, setSmtpError] = useState('')

    const handleSmtpConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target

        setSmtpConfig((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSmtpConfigSubmit = async (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()
        setSmtpError('')

        if (!smtpConfig) return

        if (
            !smtpConfig?.smtp_host ||
            !smtpConfig.smtp_port ||
            !smtpConfig.smtp_user ||
            !smtpConfig.smtp_password ||
            !smtpConfig.from_email ||
            !smtpConfig.to_email
        ) {
            setSmtpError('Fields are required!')
            return
        }

        try {
            await apiService.updateSingleton(
                'settings/smtp-test',
                smtpConfig,
                'POST'
            )
            alert('SMTP Test Successful!')
            setSmtpConfig(initialConfig)
        } catch (err) {
            console.error('Failed to save SMTP settings:', err)
            setSmtpError('Failed to save SMTP settings.')
        }
    }

    return (
        <div className="w-full">
            {!mode && <h2 className="mb-2">Test SMTP Connection</h2>}

            <form
                onSubmit={handleSmtpConfigSubmit}
                className="flex flex-col gap-2 bg-[#F8F9FA] w-full h-fit max-h-[90vh] px-8 py-6 rounded-xl drop-shadow-md"
            >
                {smtpError && (
                    <p className="text-[#DC3545] text-sm m-0">{smtpError}</p>
                )}

                <div className="flex flex-row gap-4">
                    <TextInput
                        label="SMTP Host"
                        type="text"
                        name="smtp_host"
                        placeholder="e.g. smtp.gmail.com"
                        value={smtpConfig?.smtp_host}
                        onChange={handleSmtpConfigChange}
                        className="w-full"
                    />
                    <TextInput
                        label="Port"
                        type="number"
                        name="smtp_port"
                        placeholder="Port"
                        value={smtpConfig?.smtp_port}
                        onChange={handleSmtpConfigChange}
                        className="w-full"
                    />
                </div>

                <TextInput
                    label="SMTP Username"
                    type="text"
                    name="smtp_user"
                    placeholder="e.g. example@email.com"
                    value={smtpConfig?.smtp_user}
                    onChange={handleSmtpConfigChange}
                    className="w-full"
                />

                <TextInput
                    label="SMTP Password"
                    type="password"
                    name="smtp_password"
                    placeholder="SMTP Password"
                    value={smtpConfig?.smtp_password}
                    onChange={handleSmtpConfigChange}
                    className="w-full"
                />

                <div className="flex flex-row gap-4">
                    <TextInput
                        label="From Email"
                        type="text"
                        name="from_email"
                        placeholder="e.g. example@email.com"
                        value={smtpConfig?.from_email}
                        onChange={handleSmtpConfigChange}
                        className="w-full"
                    />
                    <TextInput
                        label="Send Test To"
                        type="text"
                        name="to_email"
                        placeholder="e.g. example@email.com"
                        value={smtpConfig?.to_email}
                        onChange={handleSmtpConfigChange}
                        className="w-full"
                    />
                </div>

                <TextInput
                    label="Use TLS"
                    type="checkbox"
                    name="smtp_use_tls"
                    checked={smtpConfig?.smtp_use_tls}
                    onChange={handleSmtpConfigChange}
                    className="accent-[#3572A1] mr-1 cursor-pointer"
                    checkboxClass="font-medium"
                />

                <DefaultButton
                    type="submit"
                    children="Send Test Email"
                    className="w-full bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                />
            </form>
        </div>
    )
}

export default SMTPConfigurationForm
