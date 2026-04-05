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
 * Create a timestamped backup of bookTrackerData.json.
 * Keeps at most MAX_BACKUPS files, deleting the oldest when over the limit.
 * Returns the backup file path on success, or false on failure / no data.
 */
const createBackup = async () => {
  try {
    const dataPath = await ensureDataDir();
    const sourceFile = path.join(dataPath, 'bookTrackerData.json');

    try {
      await fs.access(sourceFile);
    } catch {
      return false; // Nothing to back up yet
    }

    const backupDir = await ensureBackupDir();

    // Timestamp format: backup-2026-04-04T14-30-00-000Z.json
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    await fs.copyFile(sourceFile, backupFile);
    await rotateBackups(backupDir);

    console.log(`Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('Error creating backup:', error);
    return false;
  }
};

module.exports = {
  loadData,
  saveData,
  createBackup,
};



