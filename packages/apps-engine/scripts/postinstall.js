// This file needs to be run everytime the apps-engine is installed
// which includes "production" installations (meant only to be used by apps)
// Since `ts-node` is a dev dependency and will not be installed by NPM on app
// projects, we need a JS file for this

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
