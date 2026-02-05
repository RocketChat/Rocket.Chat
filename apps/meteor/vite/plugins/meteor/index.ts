import path from 'node:path';

import type { PluginOption } from 'vite';

import { globals } from './plugins/globals.ts';
import { replace } from './plugins/replace.ts';
import { resolve } from './plugins/resolve.ts';
import type { PluginOptions, ResolvedPluginOptions } from './plugins/shared/config.ts';
import { shim } from './plugins/shim.ts';
import { treeshake } from './plugins/treeshake.ts';

export default function meteorPlugin(options: PluginOptions = {}): PluginOption {
	const resolvedConfig = resolveConfig(options);
	// This order is important
	// replace must come first to replace constants used in other plugins
	// treeshake must come after replace to remove code based on replaced constants
	// shim must come after treeshake to add imports to the final code
	// resolve and globals can come last to handle any remaining imports
	return [replace, treeshake, shim, resolve, globals].map((plugin) => plugin(resolvedConfig));
}

function resolveConfig(options: PluginOptions): ResolvedPluginOptions {
	const parsePort = (value?: string | number | null) => {
		if (typeof value === 'number') {
			return Number.isFinite(value) && value > 0 ? value : undefined;
		}
		if (typeof value === 'string') {
			const parsed = Number(value);
			if (Number.isFinite(parsed) && parsed > 0) {
				return parsed;
			}
		}
		return undefined;
	};

	const projectRoot = path.resolve(options.projectRoot ? options.projectRoot : './');
	const programsDir = options.programsDir
		? path.resolve(options.programsDir)
		: path.join(projectRoot, '.meteor', 'local', 'build', 'programs');

	return {
		prefix: options.prefix || 'meteor/',
		treeshake: options.treeshake ?? process.env.NODE_ENV === 'production',
		isClient: options.isClient ?? true,
		projectRoot,
		programsDir,
		runtimeImportId: options.runtimeImportId || 'virtual:meteor-runtime',
		rootUrl: new URL(options.rootUrl || process.env.ROOT_URL || 'http://localhost:5173/'),
		meteorServerPort:
			parsePort(options.meteorServerPort) ||
			parsePort(process.env.VITE_METEOR_SERVER_PORT) ||
			parsePort(process.env.METEOR_SERVER_PORT) ||
			33335,
		disableSockJS: options.disableSockJS ?? true,
		isModern: options.isModern ?? true,
	};
}
