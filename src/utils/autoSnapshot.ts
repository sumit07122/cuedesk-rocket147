import { exportClubBackup, downloadBackupFile, restoreClubBackup, ClubBackupSnapshot } from './backupService';

const SNAPSHOT_PREFIX = 'oneshot_daily_snapshot_';

/**
 * Checks if a daily backup snapshot was generated today, and creates one automatically if missing.
 */
export async function performDailyAutoSnapshot(clubId: string = 'oneshot-club'): Promise<ClubBackupSnapshot | null> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const snapshotKey = `${SNAPSHOT_PREFIX}${todayStr}`;

    // Check if snapshot already exists for today
    const existing = localStorage.getItem(snapshotKey);
    if (existing) {
      return JSON.parse(existing) as ClubBackupSnapshot;
    }

    // Generate new snapshot
    const snapshot = await exportClubBackup(clubId);
    localStorage.setItem(snapshotKey, JSON.stringify(snapshot));
    
    // Prune old snapshots keeping last 7 days
    pruneOldSnapshots(7);

    console.log(`✅ Daily snapshot automatically created for ${todayStr}`);
    return snapshot;
  } catch (err) {
    console.warn('Daily auto snapshot warning:', err);
    return null;
  }
}

/**
 * Get list of all available daily auto-snapshots stored locally.
 */
export function getAvailableAutoSnapshots(): { date: string; timestamp: number; key: string }[] {
  const snapshots: { date: string; timestamp: number; key: string }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SNAPSHOT_PREFIX)) {
        const dateStr = key.replace(SNAPSHOT_PREFIX, '');
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data) as ClubBackupSnapshot;
          snapshots.push({
            date: dateStr,
            timestamp: parsed.exportedAt || Date.now(),
            key
          });
        }
      }
    }
  } catch (err) {
    console.warn('Error reading auto snapshots:', err);
  }
  return snapshots.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Restore a specific local daily auto-snapshot
 */
export async function restoreAutoSnapshot(clubId: string, snapshotKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = localStorage.getItem(snapshotKey);
    if (!data) {
      throw new Error('Snapshot file not found in local storage.');
    }
    const snapshot = JSON.parse(data) as ClubBackupSnapshot;
    return await restoreClubBackup(clubId, snapshot);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Snapshot restore failed.'
    };
  }
}

function pruneOldSnapshots(maxDaysToKeep: number = 7): void {
  try {
    const snapshots = getAvailableAutoSnapshots();
    if (snapshots.length > maxDaysToKeep) {
      for (let i = maxDaysToKeep; i < snapshots.length; i++) {
        localStorage.removeItem(snapshots[i].key);
      }
    }
  } catch (e) {
    // Ignore prune errors
  }
}
