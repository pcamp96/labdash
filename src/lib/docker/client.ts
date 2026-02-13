import Docker from 'dockerode';

// Initialize Docker client
const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
});

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  labels: Record<string, string>;
  ports: Array<{
    privatePort: number;
    publicPort?: number;
    type: string;
  }>;
}

export interface ContainerStats {
  cpuPercent: number;
  memoryUsed: number;
  memoryLimit: number;
  memoryPercent: number;
  networkRx: number;
  networkTx: number;
  blockRead: number;
  blockWrite: number;
}

export async function listContainers(all = true): Promise<ContainerInfo[]> {
  try {
    const containers = await docker.listContainers({ all });

    return containers.map((container) => ({
      id: container.Id,
      name: container.Names[0]?.replace(/^\//, '') || '',
      image: container.Image,
      state: container.State,
      status: container.Status,
      created: container.Created,
      labels: container.Labels || {},
      ports: container.Ports.map((port) => ({
        privatePort: port.PrivatePort,
        publicPort: port.PublicPort,
        type: port.Type,
      })),
    }));
  } catch (error) {
    console.error('Error listing containers:', error);
    throw new Error('Failed to list containers');
  }
}

export async function getContainer(id: string) {
  try {
    const container = docker.getContainer(id);
    const info = await container.inspect();
    return info;
  } catch (error) {
    console.error(`Error getting container ${id}:`, error);
    throw new Error(`Failed to get container ${id}`);
  }
}

export async function getContainerStats(id: string): Promise<ContainerStats> {
  try {
    const container = docker.getContainer(id);
    const stats = await container.stats({ stream: false });

    // Calculate CPU percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    // Calculate memory usage
    const memoryUsed = stats.memory_stats.usage - (stats.memory_stats.stats?.cache || 0);
    const memoryLimit = stats.memory_stats.limit;
    const memoryPercent = (memoryUsed / memoryLimit) * 100;

    // Calculate network I/O
    const networks = stats.networks || {};
    const networkRx = Object.values(networks).reduce((acc: number, net: any) => acc + net.rx_bytes, 0);
    const networkTx = Object.values(networks).reduce((acc: number, net: any) => acc + net.tx_bytes, 0);

    // Calculate block I/O
    const blockRead = stats.blkio_stats.io_service_bytes_recursive?.find((item: any) => item.op === 'read')?.value || 0;
    const blockWrite = stats.blkio_stats.io_service_bytes_recursive?.find((item: any) => item.op === 'write')?.value || 0;

    return {
      cpuPercent: isNaN(cpuPercent) ? 0 : Number(cpuPercent.toFixed(2)),
      memoryUsed,
      memoryLimit,
      memoryPercent: isNaN(memoryPercent) ? 0 : Number(memoryPercent.toFixed(2)),
      networkRx,
      networkTx,
      blockRead,
      blockWrite,
    };
  } catch (error) {
    console.error(`Error getting stats for container ${id}:`, error);
    throw new Error(`Failed to get stats for container ${id}`);
  }
}

export async function getContainerLogs(id: string, tail = 100): Promise<string> {
  try {
    const container = docker.getContainer(id);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });

    // Convert buffer to string and remove Docker log headers
    return logs
      .toString('utf8')
      .split('\n')
      .map((line) => line.substring(8)) // Remove 8-byte header
      .join('\n');
  } catch (error) {
    console.error(`Error getting logs for container ${id}:`, error);
    throw new Error(`Failed to get logs for container ${id}`);
  }
}

export async function startContainer(id: string): Promise<void> {
  try {
    const container = docker.getContainer(id);
    await container.start();
  } catch (error) {
    console.error(`Error starting container ${id}:`, error);
    throw new Error(`Failed to start container ${id}`);
  }
}

export async function stopContainer(id: string): Promise<void> {
  try {
    const container = docker.getContainer(id);
    await container.stop();
  } catch (error) {
    console.error(`Error stopping container ${id}:`, error);
    throw new Error(`Failed to stop container ${id}`);
  }
}

export async function restartContainer(id: string): Promise<void> {
  try {
    const container = docker.getContainer(id);
    await container.restart();
  } catch (error) {
    console.error(`Error restarting container ${id}:`, error);
    throw new Error(`Failed to restart container ${id}`);
  }
}

export async function removeContainer(id: string, force = false): Promise<void> {
  try {
    const container = docker.getContainer(id);
    await container.remove({ force });
  } catch (error) {
    console.error(`Error removing container ${id}:`, error);
    throw new Error(`Failed to remove container ${id}`);
  }
}

export { docker };
