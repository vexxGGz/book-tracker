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

module.exports = {
  loadData,
  saveData
};

