const { app } = require('electron');
const fs = require('fs').promises;
const path = require('path');

// Get app data directory
const getDataPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'data');
};

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataPath = getDataPath();
  try {
    await fs.access(dataPath);
  } catch {
    await fs.mkdir(dataPath, { recursive: true });
  }
  return dataPath;
};

// Load data from file
const loadData = async (key) => {
  try {
    const dataPath = await ensureDataDir();
    const filePath = path.join(dataPath, `${key}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, return null
      if (error.code === 'ENOENT') {
        return null;
      }
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  } catch (error) {
    console.error('Error in loadData:', error);
    return null;
  }
};

// Save data to file
const saveData = async (key, value) => {
  try {
    const dataPath = await ensureDataDir();
    const filePath = path.join(dataPath, `${key}.json`);

    await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error in saveData:', error);
    return false;
  }
};

// ── Auto-backup ──────────────────────────────────────────────────────────────

const MAX_BACKUPS = 3;

const getBackupDir = () => path.join(app.getPath('userData'), 'backups');

const ensureBackupDir = async () => {
  const backupDir = getBackupDir();
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
  }
  return backupDir;
};

/**
 * Rotate backup files, keeping only the most recent `maxCount` files.
 */
const rotateBackups = async (backupDir) => {
  try {
    const files = await fs.readdir(backupDir);
    const backupFiles = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort(); // ISO timestamps are lexicographically ordered oldest → newest

    if (backupFiles.length > MAX_BACKUPS) {
      const toDelete = backupFiles.slice(0, backupFiles.length - MAX_BACKUPS);
      for (const file of toDelete) {
        await fs.unlink(path.join(backupDir, file));
      }
    }
  } catch (error) {
    console.error('Error rotating backups:', error);
  }
};

/**
 * Create a timestamped backup of all data files in the data directory.
 * Each .json file is read and bundled into a single snapshot object keyed by
 * filename stem (e.g. { bookTrackerData: [...], readingGoals: {...}, ... }).
 * This captures full app state and automatically includes any future data keys.
 *
 * Keeps at most MAX_BACKUPS files, deleting the oldest when over the limit.
 * Returns the backup file path on success, or false on failure / no data files.
 */
const createBackup = async () => {
  try {
    const dataPath = await ensureDataDir();

    // Discover all .json files in the data directory
    const files = await fs.readdir(dataPath);
    const dataFiles = files.filter(f => f.endsWith('.json'));

    if (dataFiles.length === 0) {
      return false; // Nothing to back up yet
    }

    // Read each file and assemble a snapshot keyed by filename stem
    const snapshot = { _backupCreatedAt: new Date().toISOString() };
    for (const file of dataFiles) {
      const key = file.replace(/\.json$/, '');
      try {
        const raw = await fs.readFile(path.join(dataPath, file), 'utf8');
        snapshot[key] = JSON.parse(raw);
      } catch {
        // Skip files that can't be read or parsed (e.g. corrupt/empty)
      }
    }

    const backupDir = await ensureBackupDir();

    // Timestamp format: backup-2026-04-04T14-30-00-000Z.json
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    await fs.writeFile(backupFile, JSON.stringify(snapshot, null, 2), 'utf8');
    await rotateBackups(backupDir);

    console.log(`Backup created: ${backupFile} (keys: ${Object.keys(snapshot).filter(k => k !== '_backupCreatedAt').join(', ')})`);
    return backupFile;
  } catch (error) {
    console.error('Error creating backup:', error);
    return false;
  }
};

/**
 * List the most recent auto-backup files (newest first, max MAX_BACKUPS).
 */
const getBackups = async () => {
  try {
    const backupDir = getBackupDir();
    let files;
    try {
      files = await fs.readdir(backupDir);
    } catch {
      return []; // backup dir doesn't exist yet
    }

    const backupFiles = files
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, MAX_BACKUPS);

    const backups = [];
    for (const file of backupFiles) {
      const filePath = path.join(backupDir, file);
      try {
        const stats = await fs.stat(filePath);
        backups.push({
          path: filePath,
          filename: file,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
        });
      } catch {
        // skip unreadable files
      }
    }
    return backups;
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
};

/**
 * Restore app data from a backup or exported library file.
 * Accepts both the snapshot format (from createBackup) and a plain books array.
 */
const restoreFromBackup = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(raw);
    const dataPath = await ensureDataDir();

    if (Array.isArray(data)) {
      // Plain books export — restore only the books key
      await fs.writeFile(
        path.join(dataPath, 'bookTrackerData.json'),
        JSON.stringify(data, null, 2),
        'utf8'
      );
    } else {
      // Full snapshot — restore all keys
      for (const [key, value] of Object.entries(data)) {
        if (key === '_backupCreatedAt') continue;
        await fs.writeFile(
          path.join(dataPath, `${key}.json`),
          JSON.stringify(value, null, 2),
          'utf8'
        );
      }
    }
    return true;
  } catch (error) {
    console.error('Error restoring backup:', error);
    return false;
  }
};

module.exports = {
  loadData,
  saveData,
  createBackup,
  getBackups,
  restoreFromBackup,
};



