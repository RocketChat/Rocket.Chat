import { exec } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import type { Plugin } from 'vite';

import type { ResolvedPluginOptions } from './shared/config';

const execAsync = promisify(exec);

export function globals(resolvedConfig: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:globals',
		enforce: 'pre',
		transformIndexHtml: {
			order: 'pre',
			async handler(html) {
				return {
					tags: [
						{
							tag: 'script',
							attrs: { type: 'text/javascript' },
							injectTo: 'head',
							children: generateMeteorRuntimeConfigCode(await getMeteorRuntimeConfig(resolvedConfig)),
						},
						{
							tag: 'base',
							attrs: { href: '/' },
							injectTo: 'head',
						},
					],
					html,
				};
			},
		},
	};
}

function generateMeteorRuntimeConfigCode(config: MeteorRuntimeConfig): string {
	return `globalThis.__meteor_runtime_config__ = ${JSON.stringify(config, null, 2)};`;
}

type MeteorRuntimeConfig = {
	meteorRelease?: string;
	gitCommitHash?: string;
	meteorEnv: {
		NODE_ENV: 'production' | 'development';
		TEST_METADATA: '{}';
	};
	PUBLIC_SETTINGS: {
		packages?: Record<string, unknown>;
	};
	debug: boolean;
	ROOT_URL: string;
	ROOT_URL_PATH_PREFIX: string;
	reactFastRefreshEnabled: boolean;
	autoupdate?: {
		versions: {
			'web.browser': {
				version: '57d64a96d5dee2c01a8bae5ae0397f92336ba07b';
				versionRefreshable: '8d94ca4059b3248f95e05001720eecc4297f55e2';
				versionNonRefreshable: 'b7e8440ca6ec3bb675c64528751181ce837a8947';
				versionReplaceable: '1952018619999f014765d73c14db1f446971e849';
			};
			'web.browser.legacy': {
				version: 'a029257c16c5c71f12c8a535fdde9477dd6ef2ec';
				versionRefreshable: '8d94ca4059b3248f95e05001720eecc4297f55e2';
				versionNonRefreshable: '589e6a121e2123c6e05d456f05ff2c59d457bac0';
				versionReplaceable: '1952018619999f014765d73c14db1f446971e849';
			};
		};
		autoupdateVersion: null;
		autoupdateVersionRefreshable: null;
		autoupdateVersionCordova: null;
		appId: 'litkb51p3rl.a6n2o6zsiajn';
	};
	appId?: string;
	accountsConfigCalled?: boolean;
	isModern?: boolean;
	DISABLE_SOCKJS?: boolean;
};

async function getMeteorRuntimeConfig(resolvedConfig: ResolvedPluginOptions): Promise<MeteorRuntimeConfig> {
	const [meteorRelease, gitCommitHash] = await Promise.all([getMeteorRelease(), getGitCommitHash()]);

	const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development';

	return {
		meteorEnv: {
			NODE_ENV: nodeEnv,
			TEST_METADATA: '{}',
		},
		ROOT_URL: resolvedConfig.rootUrl.toString(),
		ROOT_URL_PATH_PREFIX: '',
		meteorRelease: meteorRelease || undefined,
		gitCommitHash: gitCommitHash || undefined,
		PUBLIC_SETTINGS: {},
		debug: process.env.NODE_ENV !== 'production',
		reactFastRefreshEnabled: false,
		DISABLE_SOCKJS: resolvedConfig.disableSockJS,
		isModern: resolvedConfig.isModern,
	};
}

async function getGitCommitHash(): Promise<string | null> {
	try {
		const { stdout } = await execAsync('git rev-parse HEAD');
		return stdout.trim();
	} catch {
		return null;
	}
}

async function getMeteorRelease(): Promise<string | null> {
	try {
		// Read from .meteor/release file
		const release = await readFile('.meteor/release', 'utf-8');
		return release.trim();
	} catch {
		return null;
	}
}

// const defaultMeteorRuntimeConfig = {
//     "meteorRelease": "METEOR@3.3.2",
//     "gitCommitHash": "2003802793b0ab6b043bce6457cfc0c3576afe95",
//     "meteorEnv": {
//         "NODE_ENV": "production",
//         "TEST_METADATA": "{}"
//     },
//     "PUBLIC_SETTINGS": {
//         "packages": {
//             "dynamic-import": {
//                 "useLocationOrigin": true
//             }
//         }
//     },
//     "debug": false,
//     "ROOT_URL": "https://unstable.qa.rocket.chat",
//     "ROOT_URL_PATH_PREFIX": "",
//     "reactFastRefreshEnabled": true,
//     "autoupdate": {
//         "versions": {
//             "web.browser": {
//                 "version": "57d64a96d5dee2c01a8bae5ae0397f92336ba07b",
//                 "versionRefreshable": "8d94ca4059b3248f95e05001720eecc4297f55e2",
//                 "versionNonRefreshable": "b7e8440ca6ec3bb675c64528751181ce837a8947",
//                 "versionReplaceable": "1952018619999f014765d73c14db1f446971e849"
//             },
//             "web.browser.legacy": {
//                 "version": "a029257c16c5c71f12c8a535fdde9477dd6ef2ec",
//                 "versionRefreshable": "8d94ca4059b3248f95e05001720eecc4297f55e2",
//                 "versionNonRefreshable": "589e6a121e2123c6e05d456f05ff2c59d457bac0",
//                 "versionReplaceable": "1952018619999f014765d73c14db1f446971e849"
//             }
//         },
//         "autoupdateVersion": null,
//         "autoupdateVersionRefreshable": null,
//         "autoupdateVersionCordova": null,
//         "appId": "litkb51p3rl.a6n2o6zsiajn"
//     },
//     "appId": "litkb51p3rl.a6n2o6zsiajn",
//     "accountsConfigCalled": true,
//     "isModern": true
// } as const;
