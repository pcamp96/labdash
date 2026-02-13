export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your LabDash instance
        </p>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <p>Settings will be displayed here.</p>
        <p className="text-sm mt-2">
          Manage users, services, dashboards, and system preferences.
        </p>
      </div>
    </div>
  )
}
