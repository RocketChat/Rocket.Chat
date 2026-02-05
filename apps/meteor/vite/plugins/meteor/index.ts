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
	return [replace, shim, resolve, treeshake, globals].map((plugin) => plugin(resolvedConfig));
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
