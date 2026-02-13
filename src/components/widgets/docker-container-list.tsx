"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Square, RotateCw, Container, Activity } from "lucide-react"
import { useState } from "react"

interface DockerContainer {
  id: string
  name: string
  image: string
  state: string
  status: string
  created: number
  ports: Array<{
    privatePort: number
    publicPort?: number
    type: string
  }>
}

export function DockerContainerList() {
  const { data: containers, isLoading, refetch } = useQuery<DockerContainer[]>({
    queryKey: ["docker-containers"],
    queryFn: async () => {
      const response = await fetch("/api/docker/containers")
      if (!response.ok) throw new Error("Failed to fetch containers")
      return response.json()
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function handleAction(containerId: string, action: "start" | "stop" | "restart") {
    setActionLoading(containerId)
    try {
      const response = await fetch(`/api/docker/containers/${containerId}/${action}`, {
        method: "POST",
      })
      if (!response.ok) throw new Error(`Failed to ${action} container`)
      await refetch()
    } catch (error) {
      console.error(`Error ${action}ing container:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  function getStateColor(state: string) {
    switch (state.toLowerCase()) {
      case "running":
        return "bg-green-500"
      case "exited":
        return "bg-red-500"
      case "paused":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  function formatUptime(created: number) {
    const now = Math.floor(Date.now() / 1000)
    const seconds = now - created
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Container className="h-5 w-5" />
          <span>Docker Containers</span>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RotateCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && !containers ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading containers...
          </div>
        ) : !containers || containers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No containers found
          </div>
        ) : (
          <div className="space-y-3">
            {containers.map((container) => (
              <div
                key={container.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStateColor(container.state)}`} />
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{container.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {container.image}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {container.state === "running" ? (
                      <span className="text-green-600 dark:text-green-400">
                        Up {formatUptime(container.created)}
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        {container.status}
                      </span>
                    )}
                  </div>
                  {container.ports.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {container.ports
                        .filter((p) => p.publicPort)
                        .map((p) => `${p.publicPort}:${p.privatePort}`)
                        .join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {container.state === "running" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(container.id, "restart")}
                        disabled={actionLoading === container.id}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(container.id, "stop")}
                        disabled={actionLoading === container.id}
                      >
                        <Square className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(container.id, "start")}
                      disabled={actionLoading === container.id}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
