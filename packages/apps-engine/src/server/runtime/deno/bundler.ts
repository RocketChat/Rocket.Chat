import * as path from 'path';

import { build, type PluginBuild, type OnLoadArgs, type OnResolveArgs } from 'esbuild';

import type { IParseAppPackageResult } from '../../compiler';

/**
 * Some legacy apps that might be installed in workspaces have not been bundled after compilation,
 * leading to multiple files being sent to the subprocess and requiring further logic to require one another.
 * This makes running the app in the Deno Runtime much more difficult, so instead we bundle the files at runtime.
 */
export async function bundleLegacyApp(appPackage: IParseAppPackageResult) {
    const buildResult = await build({
        write: false,
        bundle: true,
        minify: true,
        platform: 'node',
        target: ['node10'],
        define: {
            'global.Promise': 'Promise',
        },
        external: ['@rocket.chat/apps-engine/*'],
        stdin: {
            contents: appPackage.files[appPackage.info.classFile],
            sourcefile: appPackage.info.classFile,
            loader: 'js',
        },
        plugins: [
            {
                name: 'legacy-app',
                setup(build: PluginBuild) {
                    build.onResolve({ filter: /.*/ }, (args: OnResolveArgs) => {
                        if (args.namespace === 'file') {
                            return;
                        }

                        const modulePath = path.join(path.dirname(args.importer), args.path).concat('.js');

                        const hasFile = !!appPackage.files[modulePath];

                        if (hasFile) {
                            return {
                                namespace: 'app-source',
                                path: modulePath,
                            };
                        }

                        // require('../') or require('./') are both valid, but aren't included in the files record in the same way
                        // we need to treat those differently
                        if (/\.\.?\//.test(args.path)) {
                            const indexModulePath = modulePath.replace(/\.js$/, `${path.sep}index.js`);

                            if (appPackage.files[indexModulePath]) {
                                return {
                                    namespace: 'app-source',
                                    path: indexModulePath,
                                };
                            }
                        }

                        return {
                            path: args.path,
                            external: true,
                        };
                    });

                    build.onLoad({ filter: /.*/, namespace: 'app-source' }, (args: OnLoadArgs) => {
                        if (!appPackage.files[args.path]) {
                            return {
                                errors: [
                                    {
                                        text: `File ${args.path} could not be found`,
                                    },
                                ],
                            };
                        }

                        return {
                            contents: appPackage.files[args.path],
                        };
                    });
                },
            },
        ],
    });

    const [{ text: bundle }] = buildResult.outputFiles;

    appPackage.files = { [appPackage.info.classFile]: bundle };
}
