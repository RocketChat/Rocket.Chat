import { exec } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import type { Plugin } from 'vite';

import type { ResolvedPluginOptions } from './shared/config';

const execAsync = promisify(exec);

type MeteorRuntimeConfig = {
    meteorEnv: { NODE_ENV: 'production' | 'development'; TEST_METADATA: string };
    ROOT_URL: string;
    ROOT_URL_PATH_PREFIX: string;
    debug: boolean;
    reactFastRefreshEnabled: boolean;
    PUBLIC_SETTINGS: Record<string, unknown>;
    meteorRelease?: string;
    gitCommitHash?: string;
    appId?: string;
    accountsConfigCalled?: boolean;
    isModern?: boolean;
    DISABLE_SOCKJS?: boolean;
    autoupdate?: Record<string, any>;
};

export function globals(resolvedConfig: ResolvedPluginOptions): Plugin {
    return {
        name: 'meteor:globals',
        enforce: 'pre',
        transformIndexHtml: {
            order: 'pre',
            async handler(html) {
                // Fetch release and commit hash concisely using Promise chaining to handle errors
                const [meteorRelease, gitCommitHash] = await Promise.all([
                    readFile('.meteor/release', 'utf-8').then(r => r.trim()).catch(() => undefined),
                    execAsync('git rev-parse HEAD').then(r => r.stdout.trim()).catch(() => undefined)
                ]);

                const config: MeteorRuntimeConfig = {
                    meteorEnv: {
                        NODE_ENV: process.env.NODE_ENV === 'production' ? 'production' : 'development',
                        TEST_METADATA: '{}',
                    },
                    ROOT_URL: resolvedConfig.rootUrl.toString(),
                    ROOT_URL_PATH_PREFIX: '',
                    meteorRelease,
                    gitCommitHash,
                    PUBLIC_SETTINGS: {},
                    debug: process.env.NODE_ENV !== 'production',
                    reactFastRefreshEnabled: false,
                    DISABLE_SOCKJS: resolvedConfig.disableSockJS,
                    isModern: resolvedConfig.isModern,
                };

                const scriptContent = `const config = ${JSON.stringify(config, null, 2)};
    config.ROOT_URL = window.location.origin;
    globalThis.__meteor_runtime_config__ = config;`;

                return {
                    html,
                    tags: [
                        { tag: 'script', attrs: { type: 'text/javascript' }, injectTo: 'head', children: scriptContent },
                        { tag: 'base', attrs: { href: '/' }, injectTo: 'head' },
                    ],
                };
            },
        },
    };
}