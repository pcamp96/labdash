import { DockerContainerList } from "@/components/widgets/docker-container-list"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your homelab services
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <DockerContainerList />
      </div>
    </div>
  )
}
