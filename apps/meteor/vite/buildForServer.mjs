// Builds the web client for the Rocket.Chat server to serve: the bundle goes to `public/bundle`, which the server
// ships as static files, and the manifest to `private/`, which the server reads to put the entry into its page.
import { cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, '..');
const dist = join(here, 'dist');

process.env.RC_CLIENT_TARGET = 'server';
// Like the server, read workspace packages from their build, whose dependencies the app installs.
process.env.RC_WORKSPACE_DIST = '1';

await build({ configFile: join(here, 'vite.config.mts') });

rmSync(join(appRoot, 'public/bundle'), { recursive: true, force: true });
cpSync(join(dist, 'bundle'), join(appRoot, 'public/bundle'), { recursive: true });
cpSync(join(dist, '.vite/manifest.json'), join(appRoot, 'private/vite-manifest.json'));
