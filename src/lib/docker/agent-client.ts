/**
 * Docker client wrapper that routes requests to agents
 */

import { agentManager } from '@/lib/agents/manager';
import { prisma } from '@/lib/db';
import * as localDocker from './client';
import { ContainerInfo, ContainerStats } from './client';

export async function listContainers(hostId?: string, all = true): Promise<ContainerInfo[]> {
  if (!hostId) {
    // No host specified - use local Docker
    return localDocker.listContainers(all);
  }

  const host = await prisma.dockerHost.findUnique({ where: { id: hostId } });

  if (!host || !host.enabled) {
    throw new Error('Docker host not found or disabled');
  }

  if (host.type === 'local') {
    return localDocker.listContainers(all);
  }

  if (host.type === 'agent') {
    // Route to agent
    const containers = await agentManager.sendRequest(hostId, 'list_containers', { all });

    // Map to our ContainerInfo interface
    return containers.map((container: any) => ({
      id: container.Id,
      name: container.Names[0]?.replace(/^\//, '') || '',
      image: container.Image,
      state: container.State,
      status: container.Status,
      created: container.Created,
      labels: container.Labels || {},
      ports: container.Ports.map((port: any) => ({
        privatePort: port.PrivatePort,
        publicPort: port.PublicPort,
        type: port.Type,
      })),
    }));
  }

  throw new Error(`Unsupported host type: ${host.type}`);
}

export async function getContainer(hostId: string | undefined, containerId: string) {
  if (!hostId) {
    return localDocker.getContainer(containerId);
  }

  const host = await prisma.dockerHost.findUnique({ where: { id: hostId } });

  if (!host || !host.enabled) {
    throw new Error('Docker host not found or disabled');
  }

  if (host.type === 'local') {
    return localDocker.getContainer(containerId);
  }

  if (host.type === 'agent') {
    return agentManager.sendRequest(hostId, 'get_container', { id: containerId });
  }

  throw new Error(`Unsupported host type: ${host.type}`);
}

export async function getContainerStats(hostId: string | undefined, containerId: string): Promise<ContainerStats> {
  if (!hostId) {
    return localDocker.getContainerStats(containerId);
  }

  const host = await prisma.dockerHost.findUnique({ where: { id: hostId } });

  if (!host || !host.enabled) {
    throw new Error('Docker host not found or disabled');
  }

  if (host.type === 'local') {
    return localDocker.getContainerStats(containerId);
  }

  if (host.type === 'agent') {
    const stats = await agentManager.sendRequest(hostId, 'container_stats', { id: containerId });

    // Parse stats same way as local client
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuPercent = (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

    const memoryUsed = stats.memory_stats.usage - (stats.memory_stats.stats?.cache || 0);
    const memoryLimit = stats.memory_stats.limit;
    const memoryPercent = (memoryUsed / memoryLimit) * 100;

    const networks = stats.networks || {};
    const networkRx = Object.values(networks).reduce((acc: number, net: any) => acc + net.rx_bytes, 0);
    const networkTx = Object.values(networks).reduce((acc: number, net: any) => acc + net.tx_bytes, 0);

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
  }

  throw new Error(`Unsupported host type: ${host.type}`);
}

export async function getContainerLogs(hostId: string | undefined, containerId: string, tail = 100): Promise<string> {
  if (!hostId) {
    return localDocker.getContainerLogs(containerId, tail);
  }

  const host = await prisma.dockerHost.findUnique({ where: { id: hostId } });

  if (!host || !host.enabled) {
    throw new Error('Docker host not found or disabled');
  }

  if (host.type === 'local') {
    return localDocker.getContainerLogs(containerId, tail);
  }

  if (host.type === 'agent') {
    const response = await agentManager.sendRequest(hostId, 'container_logs', { id: containerId, tail });
    return response.logs;
  }

  throw new Error(`Unsupported host type: ${host.type}`);
}

export async function startContainer(hostId: string | undefined, containerId: string): Promise<void> {
  if (!hostId) {
    return localDocker.startContainer(containerId);
  }

  const host = await prisma.dockerHost.findUnique({ where: { id: hostId } });

  if (!host || !host.enabled) {
    throw new Error('Docker host not found or disabled');
  }

  if (host.type === 'local') {
    return localDocker.startContainer(containerId);
  }

  if (host.type === 'agent') {
    await agentManager.sendRequest(hostId, 'container_action', { id: containerId, action: 'start' });
  } else {
    throw new Error(`Unsupported host type: ${host.type}`);
  }
}

export async function stopContainer(hostId: string | undefined, containerId: string): Promise<void> {
  if (!hostId) {
    return localDocker.stopContainer(containerId);
  }

  const host = await prisma.dockerHost.findUnique({ where: { id: hostId } });

  if (!host || !host.enabled) {
    throw new Error('Docker host not found or disabled');
  }

  if (host.type === 'local') {
    return localDocker.stopContainer(containerId);
  }

  if (host.type === 'agent') {
    await agentManager.sendRequest(hostId, 'container_action', { id: containerId, action: 'stop' });
  } else {
    throw new Error(`Unsupported host type: ${host.type}`);
  }
}

export async function restartContainer(hostId: string | undefined, containerId: string): Promise<void> {
  if (!hostId) {
    return localDocker.restartContainer(containerId);
  }

  const host = await prisma.dockerHost.findUnique({ where: { id: hostId } });

  if (!host || !host.enabled) {
    throw new Error('Docker host not found or disabled');
  }

  if (host.type === 'local') {
    return localDocker.restartContainer(containerId);
  }

  if (host.type === 'agent') {
    await agentManager.sendRequest(hostId, 'container_action', { id: containerId, action: 'restart' });
  } else {
    throw new Error(`Unsupported host type: ${host.type}`);
  }
}

export async function removeContainer(hostId: string | undefined, containerId: string, force = false): Promise<void> {
  if (!hostId) {
    return localDocker.removeContainer(containerId, force);
  }

  const host = await prisma.dockerHost.findUnique({ where: { id: hostId } });

  if (!host || !host.enabled) {
    throw new Error('Docker host not found or disabled');
  }

  if (host.type === 'local') {
    return localDocker.removeContainer(containerId, force);
  }

  if (host.type === 'agent') {
    await agentManager.sendRequest(hostId, 'container_action', { id: containerId, action: 'remove', force });
  } else {
    throw new Error(`Unsupported host type: ${host.type}`);
  }
}
