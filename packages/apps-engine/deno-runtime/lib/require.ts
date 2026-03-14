import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);

export const require = (mod: string) => {
	// When we try to import something from the apps-engine, we resolve the path using import maps from Deno
	// However, the import maps are configured to look at the source folder for typescript files, but during
	// runtime those files are not available
	if (mod.startsWith('@rocket.chat/apps-engine')) {
		mod = import.meta.resolve(mod).replace('file://', '');
		// Only replace the apps-engine package's "src/" segment (to load compiled JS), not e.g. /Users/foo/src/ in the path
		mod = mod.replace(/\/apps-engine\/src\//, '/apps-engine/');
	}

	return _require(mod);
};
