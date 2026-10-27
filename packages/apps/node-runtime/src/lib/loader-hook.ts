import { registerHooks } from 'node:module';
import path from 'node:path';

// This file compiles to dist/lib/loader-hook.js.
// Three levels up from dist/lib/ lands on packages/apps/ — the @rocket.chat/apps package root.
const appsPackageDir = path.resolve(__dirname, '../../..');

const PACKAGE_PREFIX = '@rocket.chat/apps';

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier === PACKAGE_PREFIX || specifier.startsWith(`${PACKAGE_PREFIX}/`)) {
			const subpath = specifier.slice(PACKAGE_PREFIX.length).replace(/^\//, '');
			const localPath = subpath ? path.join(appsPackageDir, subpath) : appsPackageDir;
			return nextResolve(localPath, context);
		}
		return nextResolve(specifier, context);
	},
});
