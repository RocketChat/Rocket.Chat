import fs from 'fs';

export function removeExistingSocketFile(socketPath) {
  try {
    const stats = fs.statSync(socketPath);
    if (stats.isSocket()) {
      fs.unlinkSync(socketPath);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

export function registerSocketFileCleanup(socketPath) {
  const removeSocketFile = () => removeExistingSocketFile(socketPath);

  process.on('exit', removeSocketFile);
  process.on('SIGINT', () => {
    removeSocketFile();
    process.exit();
  });
  process.on('SIGTERM', () => {
    removeSocketFile();
    process.exit();
  });
  process.on('uncaughtException', error => {
    console.error(error);
    removeSocketFile();
    process.exit(1);
  });
}
