import net from 'node:net';
import { runCommand } from '@/lib/command';

/**
 * Get system uptime in milliseconds - cross-platform
 * Linux: uses `uptime -s`
 * macOS: uses `sysctl -n kern.boottime`
 */
export async function getSystemUptime(): Promise<number> {
  const platform = process.platform;

  if (platform === 'darwin') {
    // macOS: use sysctl to get boot time
    const { stdout } = await runCommand('sysctl', ['-n', 'kern.boottime'], { timeoutMs: 3000 });
    // Parse: { sec = 1234567890, usec = 123456 }
    const match = stdout.match(/sec = (\d+)/);
    if (match) {
      const bootTime = parseInt(match[1]) * 1000;
      return Date.now() - bootTime;
    }
    throw new Error('Could not parse boot time');
  } else {
    // Linux: use uptime -s
    const { stdout } = await runCommand('uptime', ['-s'], { timeoutMs: 3000 });
    const bootTime = new Date(stdout.trim());
    return Date.now() - bootTime.getTime();
  }
}

/**
 * Get system memory info in MB - cross-platform
 * Linux: uses `free -m`
 * macOS: uses `vm_stat` and `sysctl`
 */
export async function getSystemMemory(): Promise<{ total: number; used: number; available: number }> {
  const platform = process.platform;

  if (platform === 'darwin') {
    // macOS: use vm_stat and sysctl
    const [{ stdout: vmStat }, { stdout: hwMemsize }] = await Promise.all([
      runCommand('vm_stat', [], { timeoutMs: 3000 }),
      runCommand('sysctl', ['-n', 'hw.memsize'], { timeoutMs: 3000 }),
    ]);

    // Parse page size (usually 4096 on macOS)
    const pageSizeMatch = vmStat.match(/page size of (\d+) bytes/);
    const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1]) : 4096;

    // Parse memory stats
    const freePages = parseInt(vmStat.match(/Pages free:\s+(\d+)/)?.[1] || '0');
    const activePages = parseInt(vmStat.match(/Pages active:\s+(\d+)/)?.[1] || '0');
    const inactivePages = parseInt(vmStat.match(/Pages inactive:\s+(\d+)/)?.[1] || '0');
    const speculativePages = parseInt(vmStat.match(/Pages speculative:\s+(\d+)/)?.[1] || '0');
    const wiredPages = parseInt(vmStat.match(/Pages wired down:\s+(\d+)/)?.[1] || '0');

    const totalBytes = parseInt(hwMemsize.trim());
    const total = Math.floor(totalBytes / 1024 / 1024);

    const usedBytes = (activePages + inactivePages + speculativePages + wiredPages) * pageSize;
    const used = Math.floor(usedBytes / 1024 / 1024);

    const freeBytes = freePages * pageSize;
    const available = Math.floor(freeBytes / 1024 / 1024);

    return { total, used, available };
  } else {
    // Linux: use free -m
    const { stdout } = await runCommand('free', ['-m'], { timeoutMs: 3000 });
    const lines = stdout.split('\n');
    const memLine = lines.find((line) => line.startsWith('Mem:'));
    if (memLine) {
      const parts = memLine.split(/\s+/);
      return {
        total: parseInt(parts[1]) || 0,
        used: parseInt(parts[2]) || 0,
        available: parseInt(parts[6]) || 0,
      };
    }
    throw new Error('Could not parse memory info');
  }
}

/**
 * Check if a port is open on a host
 */
export function isPortOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeoutMs = 1500;

    const cleanup = () => {
      socket.removeAllListeners();
      socket.destroy();
    };

    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      cleanup();
      resolve(true);
    });

    socket.once('timeout', () => {
      cleanup();
      resolve(false);
    });

    socket.once('error', () => {
      cleanup();
      resolve(false);
    });

    socket.connect(port, host);
  });
}
