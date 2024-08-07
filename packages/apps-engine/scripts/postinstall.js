// This file needs to be run everytime the apps-engine is installed
// which includes "production" installations (meant only to be used by apps)
// Since `ts-node` is a dev dependency and will not be installed by NPM on app
// projects, we need a JS file for this

const childProcess = require('child_process');
const path = require('path');

try {
    childProcess.execSync('deno info');
} catch (e) {
    console.error(
        'Could not execute "deno" in the system. It is now a requirement for the Apps-Engine framework, and Rocket.Chat apps will not work without it.\n',
        'Make sure to install Deno and run the installation process for the Apps-Engine again. More info on https://docs.deno.com/runtime/manual/getting_started/installation',
    );
    process.exit(1);
}

const rootPath = path.join(__dirname, '..');
const DENO_DIR = process.env.DENO_DIR ?? path.join(rootPath, '.deno-cache');

childProcess.execSync('deno', ['cache', 'main.ts'], {
    cwd: path.join(rootPath, 'deno-runtime'),
    env: {
        DENO_DIR,
    },
    stdio: 'inherit',
});
