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

// Vite copies `public/` into the build, so the previous bundle has to be gone first or it is carried along.
rmSync(join(appRoot, 'public/bundle'), { recursive: true, force: true });

await build({ configFile: join(here, 'vite.config.mts') });

cpSync(join(dist, 'bundle'), join(appRoot, 'public/bundle'), { recursive: true });
cpSync(join(dist, '.vite/manifest.json'), join(appRoot, 'private/vite-manifest.json'));
