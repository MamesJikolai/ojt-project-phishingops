import Message from '../../components/Message.tsx'
import BasicTable from '../../components/BasicTable.tsx'
import type { ColumnDef } from '@tanstack/react-table'
import { users } from '../../assets/users.ts'
import { useState } from 'react'
import TextInput from '../../components/TextInput.tsx'
import DefaultButton from '../../components/DefaultButton.tsx'

function Settings() {
    const [platformConfig, setPlatformConfig] = useState({
        name: '',
        url: '',
        senderName: '',
        sessionExpiry: '',
        retake: false,
        saved: '',
    })
    const [smtpConfig, setSmtpConfig] = useState({
        host: '',
        port: '',
        username: '',
        password: '',
        from: '',
        to: '',
        tls: false,
    })
    const [platformError, setPlatformError] = useState('')
    const [smtpError, setSmtpError] = useState('')

    const handlePlatformConfigChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value, type, checked } = e.target
        setPlatformConfig((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handlePlatformConfigSubmit = (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()
        setPlatformError('')

        if (
            !platformConfig.name ||
            !platformConfig.url ||
            !platformConfig.senderName ||
            !platformConfig.sessionExpiry ||
            !platformConfig.retake
        ) {
            setPlatformError('Fields are required!')
            return
        }
    }

    const handleSmtpConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setSmtpConfig((prevData) => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSmtpConfigSubmit = (
        e: React.SyntheticEvent<HTMLFormElement>
    ) => {
        e.preventDefault()
        setSmtpError('')

        if (
            !smtpConfig.host ||
            !smtpConfig.port ||
            !smtpConfig.username ||
            !smtpConfig.password ||
            !smtpConfig.from ||
            !smtpConfig.to ||
            !smtpConfig.tls
        ) {
            setSmtpError('Fields are required!')
            return
        }
    }

    const columns: ColumnDef<string>[] = [
        { accessorKey: 'username', header: 'Username' },
        { accessorKey: 'firstName', header: 'First Name' },
        { accessorKey: 'lastName', header: 'Last Name' },
        { accessorKey: 'role', header: 'Role' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'organization', header: 'Organization' },
        { accessorKey: 'created', header: 'Created' },
    ]

    return (
        <div className="flex flex-col items-start m-8">
            <Message text="Settings" />

            <div className="flex flex-row flex-wrap gap-16">
                <div>
                    <h2 className="mb-2">Platform Configuration</h2>

                    <form
                        onSubmit={handlePlatformConfigSubmit}
                        className="flex flex-col gap-[8px] bg-[#F8F9FA] w-[600px] h-fit max-h-[90vh] px-[32px] py-[24px] rounded-xl drop-shadow-md"
                    >
                        {platformError && (
                            <p className="text-[#DC3545] text-sm m-0">
                                {platformError}
                            </p>
                        )}
                        <TextInput
                            label="Platform Name"
                            type="text"
                            name="name"
                            placeholder="Platform Name"
                            value={platformConfig.name}
                            onChange={handlePlatformConfigChange}
                            className="w-full"
                        />

                        <TextInput
                            label="Platform Base URL"
                            type="text"
                            name="url"
                            placeholder="Platform Base URL"
                            value={platformConfig.url}
                            onChange={handlePlatformConfigChange}
                            className="w-full"
                        />

                        <TextInput
                            label="Default Sender Display Name"
                            type="text"
                            name="senderName"
                            placeholder="Default Sender Display Name"
                            value={platformConfig.senderName}
                            onChange={handlePlatformConfigChange}
                            className="w-full"
                        />

                        <TextInput
                            label="LMS Session Expiry (days)"
                            type="number"
                            name="senderName"
                            placeholder="LMS Session Expiry (days)"
                            value={platformConfig.senderName}
                            onChange={handlePlatformConfigChange}
                            className="w-[200px]"
                        />

                        <TextInput
                            label="Allow Quiz Retake"
                            type="checkbox"
                            onChange={handlePlatformConfigChange}
                            className="accent-[#3572A1] mr-1 cursor-pointer"
                            checkboxClass="font-medium"
                        />

                        <DefaultButton
                            type="submit"
                            children="Save Settings"
                            className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                        />

                        {/* <div className="flex flex-col gap-2 justify-center border-t-1 border-[#DDE2E5] pt-4">
                            <p className="text-[12px]">
                                Last saved: {platformConfig.saved}
                            </p>
                            <DefaultButton
                                type="submit"
                                children="Save Settings"
                                className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center"
                            />
                        </div> */}
                    </form>
                </div>

                <div>
                    <h2 className="mb-2">Test SMTP Connection</h2>

                    <form
                        onSubmit={handleSmtpConfigSubmit}
                        className="flex flex-col gap-[8px] bg-[#F8F9FA] w-[600px] h-fit max-h-[90vh] px-[32px] py-[24px] rounded-xl drop-shadow-md"
                    >
                        {smtpError && (
                            <p className="text-[#DC3545] text-sm m-0">
                                {smtpError}
                            </p>
                        )}

                        <div className="flex flex-row gap-4">
                            <TextInput
                                label="SMTP Host"
                                type="text"
                                name="host"
                                placeholder="SMTP Host"
                                value={smtpConfig.host}
                                onChange={handleSmtpConfigChange}
                                className="w-full"
                            />
                            <TextInput
                                label="Port"
                                type="text"
                                name="port"
                                placeholder="Port"
                                value={smtpConfig.port}
                                onChange={handleSmtpConfigChange}
                                className="w-full"
                            />
                        </div>

                        <TextInput
                            label="SMTP Username"
                            type="text"
                            name="username"
                            placeholder="SMTP Username"
                            value={smtpConfig.username}
                            onChange={handleSmtpConfigChange}
                            className="w-full"
                        />

                        <TextInput
                            label="SMTP Password"
                            type="text"
                            name="password"
                            placeholder="SMTP Password"
                            value={smtpConfig.password}
                            onChange={handleSmtpConfigChange}
                            className="w-full"
                        />

                        <div className="flex flex-row gap-4">
                            <TextInput
                                label="From Email"
                                type="text"
                                name="from"
                                placeholder="From Email"
                                value={smtpConfig.from}
                                onChange={handleSmtpConfigChange}
                                className="w-full"
                            />
                            <TextInput
                                label="Send Test To"
                                type="text"
                                name="to"
                                placeholder="Send Test To"
                                value={smtpConfig.to}
                                onChange={handleSmtpConfigChange}
                                className="w-full"
                            />
                        </div>

                        <TextInput
                            label="Use TLS"
                            type="checkbox"
                            onChange={handleSmtpConfigChange}
                            className="accent-[#3572A1] mr-1 cursor-pointer"
                            checkboxClass="font-medium"
                        />

                        <DefaultButton
                            type="submit"
                            children="Save Settings"
                            className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center mt-4"
                        />
                    </form>
                </div>

                <div>
                    <div className="flex flex-row justify-between items-center mb-2">
                        <h2>Admin Users</h2>
                        <DefaultButton
                            children="Add Admin"
                            className="bg-[#024C89] hover:bg-[#3572A1] text-[#F8F9FA] self-center"
                        />
                    </div>
                    <BasicTable data={users} columns={columns} />
                </div>
            </div>
        </div>
    )
}

export default Settings
