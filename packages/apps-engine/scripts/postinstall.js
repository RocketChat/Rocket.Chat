const childProcess = require('child_process');
const path = require('path');

// Find executable installed by deno-bin
const executablePath = path.join(require.resolve('deno-bin'), '..', 'bin', 'deno');

const rootPath = path.join(__dirname, '..');
const DENO_DIR = path.join(rootPath, '.deno-cache');

childProcess.spawnSync(executablePath, ['cache', 'main.ts'], {
    cwd: path.join(rootPath, 'deno-runtime'),
    env: {
        DENO_DIR,
    },
    stdio: 'inherit',
});
