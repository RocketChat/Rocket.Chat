import path from 'node:path';

import type { PluginOption } from 'vite';

import { globals } from './plugins/globals.ts';
import { resolve } from './plugins/resolve.ts';
import type { PluginOptions, ResolvedPluginOptions } from './plugins/shared/config.ts';
import { shim } from './plugins/shim.ts';

export default function meteorPlugin(pluginConfig: PluginOptions = {}): PluginOption {
	const resolvedConfig = resolveConfig(pluginConfig);
	return [shim(resolvedConfig), resolve(resolvedConfig), globals(resolvedConfig)];
}

function resolveConfig(pluginConfig: PluginOptions): ResolvedPluginOptions {
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

	const projectRoot = pluginConfig.projectRoot ? pluginConfig.projectRoot : './';
	const programsDir = pluginConfig.programsDir
		? path.resolve(pluginConfig.programsDir)
		: path.join(projectRoot, '.meteor', 'local', 'build', 'programs');

	return {
		prefix: pluginConfig.prefix || 'meteor/',
		projectRoot,
		programsDir,
		runtimeImportId: pluginConfig.runtimeImportId || 'virtual:meteor-runtime',
		modules: pluginConfig.modules || {},
		rootUrl: new URL(pluginConfig.rootUrl || process.env.ROOT_URL || 'http://localhost:5173/'),
		meteorServerPort:
			parsePort(pluginConfig.meteorServerPort) ||
			parsePort(process.env.VITE_METEOR_SERVER_PORT) ||
			parsePort(process.env.METEOR_SERVER_PORT) ||
			33335,
		disableSockJS: pluginConfig.disableSockJS ?? true,
	};
}
