import { useEffect, useState } from 'react'
import DefaultButton from '../DefaultButton'
import TextInput from '../TextInput'
import type { PlatformConfiguration } from '../../types/models'
import { apiService } from '../../services/userService'

function PlatformConfigurationForm() {
    const [platformConfig, setPlatformConfig] =
        useState<PlatformConfiguration | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [platformError, setPlatformError] = useState('')

    useEffect(() => {
        const fetchSettigns = async () => {
            try {
                setIsLoading(true)
                const fetchedData =
                    await apiService.getSingleton<PlatformConfiguration>(
                        'settings'
                    )
                setPlatformConfig(fetchedData)
            } catch (err) {
                console.error('Failed to load settings:', err)
                setPlatformError('Failed to load settings from server.')
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettigns()
    }, [])

    const handlePlatformConfigChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value, type, checked } = e.target
        setPlatformConfig((prev) =>
            prev
                ? {
                      ...prev,
                      [name]: type === 'checkbox' ? checked : value,
                  }
                : null
        )
    }

    const handlePlatformConfigSubmit = async (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()
        setPlatformError('')

        if (!platformConfig) return

        if (
            !platformConfig.platform_name ||
            !platformConfig.platform_base_url ||
            !platformConfig.default_from_name ||
            !platformConfig.session_expiry_days
        ) {
            setPlatformError('Fields are required!')
            return
        }

        try {
            await apiService.updateSingleton('settings', platformConfig)
            alert('Settings saved successfully!')
        } catch (err) {
            console.error('Failed to save settings:', err)
            setPlatformError('Failed to save settings.')
        }
    }

    if (isLoading) {
        return (
            <div className="p-4 text-gray-500 animate-pulse">
                Loading settings...
            </div>
        )
    }

    if (!platformConfig) {
        return (
            <div className="p-4 text-red-500">No configuration data found.</div>
        )
    }

    return (
        <div className="w-full">
            <h2 className="mb-2">Platform Configuration</h2>

            <form
                onSubmit={handlePlatformConfigSubmit}
                className="flex flex-col gap-2 bg-[#F8F9FA] w-full h-fit max-h-[90vh] px-8 py-6 rounded-xl drop-shadow-md"
            >
                {platformError && (
                    <p className="text-[#DC3545] text-sm m-0">
                        {platformError}
                    </p>
                )}
                <TextInput
                    label="Platform Name"
                    type="text"
                    name="platform_name"
                    placeholder="Platform Name"
                    value={platformConfig.platform_name}
                    onChange={handlePlatformConfigChange}
                    className="w-full"
                />

                <TextInput
                    label="Platform Base URL"
                    type="text"
                    name="platform_base_url"
                    placeholder="Platform Base URL"
                    value={platformConfig.platform_base_url}
                    onChange={handlePlatformConfigChange}
                    className="w-full"
                />

                <TextInput
                    label="Default Sender Display Name"
                    type="text"
                    name="default_from_name"
                    placeholder="Default Sender Display Name"
                    value={platformConfig.default_from_name}
                    onChange={handlePlatformConfigChange}
                    className="w-full"
                />

                <TextInput
                    label="LMS Session Expiry (days)"
                    type="number"
                    name="session_expiry_days"
                    placeholder="30"
                    value={platformConfig.session_expiry_days.toString()}
                    onChange={handlePlatformConfigChange}
                    className="w-[200px]"
                />

                <TextInput
                    label="Allow Quiz Retake"
                    type="checkbox"
                    name="allow_quiz_retake"
                    checked={platformConfig.allow_quiz_retake}
                    onChange={handlePlatformConfigChange}
                    className="accent-[#3572A1] mr-1 cursor-pointer"
                    checkboxClass="font-medium"
                />

                <DefaultButton
                    type="submit"
                    children="Save Settings"
                    className="w-full bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                />
            </form>
        </div>
    )
}

export default PlatformConfigurationForm
