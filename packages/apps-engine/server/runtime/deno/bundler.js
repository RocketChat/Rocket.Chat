"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundleLegacyApp = bundleLegacyApp;
const path = require("path");
const esbuild_1 = require("esbuild");
/**
 * Some legacy apps that might be installed in workspaces have not been bundled after compilation,
 * leading to multiple files being sent to the subprocess and requiring further logic to require one another.
 * This makes running the app in the Deno Runtime much more difficult, so instead we bundle the files at runtime.
 */
function bundleLegacyApp(appPackage) {
    return __awaiter(this, void 0, void 0, function* () {
        const buildResult = yield (0, esbuild_1.build)({
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
                    setup(build) {
                        build.onResolve({ filter: /.*/ }, (args) => {
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
                        build.onLoad({ filter: /.*/, namespace: 'app-source' }, (args) => {
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
    });
}
//# sourceMappingURL=bundler.js.map