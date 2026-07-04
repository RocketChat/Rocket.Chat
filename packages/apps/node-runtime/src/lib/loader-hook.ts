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

			// Prevent a crafted specifier (e.g. '@rocket.chat/apps/../../../etc') from
			// resolving to a path outside the apps package directory.
			const relative = path.relative(appsPackageDir, localPath);
			if (relative.startsWith('..') || path.isAbsolute(relative)) {
				throw new Error(`Cannot resolve "${specifier}" outside of the apps package`);
			}

			return nextResolve(localPath, context);
		}
		return nextResolve(specifier, context);
	},
});
