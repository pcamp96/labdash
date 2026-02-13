export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Services</h1>
        <p className="text-muted-foreground mt-1">
          Manage your integrated homelab services
        </p>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <p>Service integrations will be displayed here.</p>
        <p className="text-sm mt-2">
          Configure services like Sonarr, Radarr, Plex, and more to monitor them from your dashboard.
        </p>
      </div>
    </div>
  )
}
