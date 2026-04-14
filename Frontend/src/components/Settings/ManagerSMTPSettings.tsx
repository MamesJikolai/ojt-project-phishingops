import { useEffect, useState } from 'react'
import type { ManagerReminder } from '../../types/models'
import DefaultButton from '../DefaultButton'
import TextInput from '../TextInput'
import { apiService } from '../../services/userService'

function ManagerSMTPSettings() {
    const [reminderData, setReminderData] = useState<ManagerReminder | null>(
        null
    )
    const [isLoading, setIsLoading] = useState(true)
    const [reminderError, setReminderError] = useState('')

    useEffect(() => {
        const fetchSettigns = async () => {
            try {
                setIsLoading(true)
                const fetchedData =
                    await apiService.getSingleton<ManagerReminder>(
                        'settings/reminder-smtp'
                    )
                console.log(fetchedData)
                setReminderData(fetchedData)
            } catch (err) {
                console.error('Failed to load settings:', err)
                setReminderError('Failed to load settings from server.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettigns()
    }, [])

    const handleManagerSmtpChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value, type, checked } = e.target
        setReminderData((prev) =>
            prev
                ? {
                      ...prev,
                      [name]: type === 'checkbox' ? checked : value,
                  }
                : null
        )
    }

    const handleManagerSmtpSubmit = async (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()
        setReminderError('')

        if (!reminderData) {
            setReminderError('No data to save.')
            return
        }

        if (
            !reminderData.reminder_days ||
            !reminderData.reminder_from_email ||
            !reminderData.reminder_smtp_host ||
            !reminderData.reminder_smtp_port ||
            !reminderData.reminder_smtp_user
        ) {
            setReminderError('Fields are required!')
            return
        }

        try {
            await apiService.updateSingleton(
                'settings/reminder-smtp',
                reminderData,
                'PATCH'
            )
            alert('Reminder Settings Saved')
        } catch (err) {
            console.error('Failed to save reminder settings:', err)
            setReminderError('Failed to save reminder settings.')
        }
    }

    if (isLoading) {
        return (
            <div className="p-4 text-gray-500 animate-pulse">
                Loading settings...
            </div>
        )
    }

    return (
        <div className="w-full">
            <h2 className="mb-2">Manager Reminder SMTP Settings</h2>

            <form
                onSubmit={handleManagerSmtpSubmit}
                className="flex flex-col gap-2 bg-[#F8F9FA] w-full h-fit max-h-[90vh] px-8 py-6 rounded-xl drop-shadow-md"
            >
                {reminderError && (
                    <p className="text-[#DC3545] text-sm m-0">
                        {reminderError}
                    </p>
                )}

                <div className="flex flex-col gap-2 border-b-2 border-[#DDE2E5] pb-4 mb-4">
                    <h3>Reminder Settings</h3>

                    <TextInput
                        label="Reminder Days"
                        type="number"
                        name="reminder_days"
                        placeholder="Days"
                        value={reminderData?.reminder_days}
                        onChange={handleManagerSmtpChange}
                        className=""
                    />

                    <div className="flex">
                        <TextInput
                            label="Remind"
                            type="checkbox"
                            name="reminder_enabled"
                            checked={reminderData?.reminder_enabled}
                            onChange={handleManagerSmtpChange}
                            className="accent-[#3572A1] mr-1 cursor-pointer"
                            checkboxClass="font-medium"
                        />

                        <TextInput
                            label="Notify Manager"
                            type="checkbox"
                            name="manager_notify_enabled"
                            checked={reminderData?.manager_notify_enabled}
                            onChange={handleManagerSmtpChange}
                            className="accent-[#3572A1] mr-1 cursor-pointer"
                            checkboxClass="font-medium"
                        />
                    </div>
                </div>

                <h3>SMTP Settings</h3>

                <div className="flex flex-row gap-4">
                    <TextInput
                        label="SMTP Host"
                        type="text"
                        name="reminder_smtp_host"
                        placeholder="e.g. smtp.gmail.com"
                        value={reminderData?.reminder_smtp_host}
                        onChange={handleManagerSmtpChange}
                        className="w-full"
                    />
                    <TextInput
                        label="Port"
                        type="number"
                        name="reminder_smtp_port"
                        placeholder="Port"
                        value={reminderData?.reminder_smtp_port}
                        onChange={handleManagerSmtpChange}
                        className="w-full"
                    />
                </div>

                <TextInput
                    label="SMTP Username"
                    type="text"
                    name="reminder_smtp_user"
                    placeholder="e.g. example@email.com"
                    value={reminderData?.reminder_smtp_user}
                    onChange={handleManagerSmtpChange}
                    className="w-full"
                />

                <TextInput
                    label="SMTP Password"
                    type="password"
                    name="reminder_smtp_password"
                    placeholder="SMTP Password"
                    value={reminderData?.reminder_smtp_password}
                    onChange={handleManagerSmtpChange}
                    className="w-full"
                />

                <TextInput
                    label="From Email"
                    type="text"
                    name="reminder_from_email"
                    placeholder="e.g. example@email.com"
                    value={reminderData?.reminder_from_email}
                    onChange={handleManagerSmtpChange}
                    className="w-full"
                />

                <div className="flex flex-row gap-8">
                    <TextInput
                        label="Use TLS"
                        type="checkbox"
                        name="reminder_smtp_use_tls"
                        checked={reminderData?.reminder_smtp_use_tls}
                        onChange={handleManagerSmtpChange}
                        className="accent-[#3572A1] mr-1 cursor-pointer"
                        checkboxClass="font-medium"
                    />

                    <TextInput
                        label="Use SSL"
                        type="checkbox"
                        name="reminder_smtp_use_ssl"
                        checked={reminderData?.reminder_smtp_use_ssl}
                        onChange={handleManagerSmtpChange}
                        className="accent-[#3572A1] mr-1 cursor-pointer"
                        checkboxClass="font-medium"
                    />
                </div>

                <DefaultButton
                    type="submit"
                    children="Save Settings"
                    className="w-full bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                />
            </form>
        </div>
    )
}

export default ManagerSMTPSettings
