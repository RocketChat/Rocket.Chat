import path from 'node:path';

import type * as vite from 'vite';

export type PluginOptions = {
	/**
	 * The root URL of the Meteor application.
	 * @default process.env.ROOT_URL || 'http://localhost:3000/'.
	 */
	rootUrl?: string;
	/**
	 * The path to the Meteor project root directory.
	 * @default process.cwd().
	 */
	projectRoot?: string;
	/**
	 * The path to the Meteor programs directory relative to the project root.
	 * @default '.meteor/local/build/programs/'
	 */
	programsDir?: string;
	/**
	 * The Meteor packages to include or exclude.
	 * @default {}
	 */
	modules?: Record<string, null | string>;
	/**
	 * Port where the Meteor server runtime should listen for HTTP/SockJS traffic.
	 * @default process.env.VITE_METEOR_SERVER_PORT || process.env.METEOR_SERVER_PORT || 33335
	 */
	meteorServerPort?: number;
}

export type ResolvedPluginOptions = {
	/**
	 * The root URL of the Meteor application.
	 */
	readonly rootUrl: URL;
	/**
	 * The absolute path to the Meteor project root directory.
	 */
	readonly projectRoot: string;
	/**
	 * The absolute path to the Meteor programs directory.
	 */
	readonly programsDir: string;
	/**
	 * The Meteor packages to include or exclude.
	 */
	readonly modules: Record<string, null | string>;
	/**
	 * Port where the Meteor runtime's HTTP server listens.
	 */
	readonly meteorServerPort: number;
}

export function resolveConfig(pluginConfig: PluginOptions, _userConfig: vite.UserConfig, _viteEnv: vite.ConfigEnv): ResolvedPluginOptions {
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

	const projectRoot = pluginConfig.projectRoot ? path.resolve(pluginConfig.projectRoot) : process.cwd();
	const programsDir = pluginConfig.programsDir
		? path.resolve(pluginConfig.programsDir)
		: path.join(projectRoot, '.meteor', 'local', 'build', 'programs');

	return {
		projectRoot,
		programsDir,
		modules: pluginConfig.modules || {},
		rootUrl: new URL(pluginConfig.rootUrl || process.env.ROOT_URL || 'http://localhost:5173/'),
		meteorServerPort:
			parsePort(pluginConfig.meteorServerPort) ||
			parsePort(process.env.VITE_METEOR_SERVER_PORT) ||
			parsePort(process.env.METEOR_SERVER_PORT) ||
			33335,
	};
}
