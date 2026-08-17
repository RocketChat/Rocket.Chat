import path from 'node:path';

// Meteor exposes `Assets` as a bare global; importing installs it
import '@rocket.chat/meteor-server/assets';
// Registers the meteor_autoupdate_clientVersions publication that
// MeteorService.started() calls (provided by meteor/autoupdate before)
import '@rocket.chat/meteor-server/autoupdate';
// Installs the password login handler and password helpers on Accounts;
// nothing imports `meteor/accounts-password` directly, Meteor loaded it as a package
import '@rocket.chat/meteor-server/accounts-password';
import { serveClient } from '@rocket.chat/meteor-server/client';
import { runStartupCallbacks } from '@rocket.chat/meteor-server/meteor';
import { connectToDatabase } from '@rocket.chat/meteor-server/mongo';
import { startWebApp } from '@rocket.chat/meteor-server/webapp';

/**
 * Entrypoint for the meteor-free server build (see vite.config.server.mts).
 *
 * Under Meteor these steps were implicit: Meteor connected to Mongo, ran the
 * eager module graph, flushed `Meteor.startup` callbacks, then listened. Here
 * the entrypoint owns that sequence.
 */

// Fail fast on an unreachable database rather than at the first query
await connectToDatabase();

// The model registry must be populated before anything reads it. `./main`
// imports `./models` first for this reason, but under ESM the static imports of
// the whole graph are hoisted, so `./settings` can evaluate its top-level await
// before `./models` ran. Loading it as a separate step pins the order.
await import('./models');

// Loads the app's server module graph, registering methods, routes,
// middleware and startup callbacks along the way
await import('./main');

// Meteor propagates a throwing startup hook too, but Rocket.Chat installs an
// uncaughtException handler that swallows it — without this the process would
// stay alive, never listening, with no indication of why.
try {
	await runStartupCallbacks();
} catch (err) {
	console.error('Startup callbacks failed; aborting boot', err);
	process.exit(1);
}

// Serve the vite-built client, the way Meteor served its client program. Mounted
// last so every route the app claimed above keeps priority. Opt out with
// SERVE_CLIENT=false when running the vite dev server in front instead.
if (process.env.SERVE_CLIENT !== 'false') {
	try {
		await serveClient({ clientDir: process.env.CLIENT_DIR ?? path.resolve(import.meta.dirname, '../dist') });
	} catch (err) {
		console.warn(`Not serving the client: ${(err as Error).message}`);
	}
}

// Same reasoning as above: a failure to bind (EADDRINUSE, say) would otherwise
// be swallowed, leaving a live process that never serves anything.
try {
	const server = await startWebApp();
	const address = server.address();
	const port = typeof address === 'object' && address ? address.port : address;

	console.log(`Rocket.Chat server listening on port ${port}`);
} catch (err) {
	console.error('Failed to start the HTTP server', err);
	process.exit(1);
}
