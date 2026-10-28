// Builds the web client for the Rocket.Chat server to serve: the bundle goes to `public/bundle`, which the server
// ships as static files, and the manifest to `private/`, which the server reads to put the entry into its page.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

// Tamagui links its zero-runtime stylesheet from `index.html`, which the server does not render, so it joins the
// entry's stylesheets in the manifest, under a content hash like the rest of the bundle.
const manifest = JSON.parse(readFileSync(join(dist, '.vite/manifest.json'), 'utf8'));
const zeroStylesheet = join(dist, 'tamagui-zero.css');
if (existsSync(zeroStylesheet)) {
	const css = readFileSync(zeroStylesheet);
	const file = `bundle/tamagui-zero-${createHash('sha256').update(css).digest('hex').slice(0, 8)}.css`;
	writeFileSync(join(appRoot, 'public', file), css);
	const entry = Object.values(manifest).find((chunk) => chunk.isEntry);
	entry.css = [...(entry.css ?? []), file];
}
writeFileSync(join(appRoot, 'private/vite-manifest.json'), JSON.stringify(manifest, null, 2));
