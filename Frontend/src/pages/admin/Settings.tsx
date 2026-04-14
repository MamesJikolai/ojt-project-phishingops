import Message from '../../components/Message.tsx'
import PlatformConfigurationForm from '../../components/Settings/PlatformConfigurationForm.tsx'
import SMTPConfigurationForm from '../../components/Settings/SMTPConfigurationForm.tsx'
import AdminUsers from '../../components/Settings/AdminUsers.tsx'
import ManagerSMTPSettings from '../../components/Settings/ManagerSMTPSettings.tsx'

function Settings() {
    return (
        <div className="flex flex-col items-start p-4 md:p-8 w-full box-border">
            <Message text="Settings" />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8 w-full max-w-7xl items-start">
                <PlatformConfigurationForm />

                <ManagerSMTPSettings />

                <SMTPConfigurationForm />

                <AdminUsers />
            </div>
        </div>
    )
}

export default Settings
