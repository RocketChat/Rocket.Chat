import type { IParseAppPackageResult } from '@rocket.chat/apps-engine/server/compiler/IParseAppPackageResult.ts';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { require } from '../../lib/require.ts';
import { sanitizeDeprecatedUsage } from '../../lib/sanitizeDeprecatedUsage.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';
import { Socket } from 'node:net';

const ALLOWED_NATIVE_MODULES = ['path', 'url', 'crypto', 'buffer', 'stream', 'net', 'http', 'https', 'zlib', 'util', 'punycode', 'os', 'querystring', 'fs'];
const ALLOWED_EXTERNAL_MODULES = ['uuid'];


function prepareEnvironment() {
    // Deno does not behave equally to Node when it comes to piping content to a socket
    // So we intervene here
    const originalFinal = Socket.prototype._final;
    Socket.prototype._final = function _final(cb) {
        // Deno closes the readable stream in the Socket earlier than Node
        // The exact reason for that is yet unknown, so we'll need to simply delay the execution
        // which allows data to be read in a response
        setTimeout(() => originalFinal.call(this, cb), 1);
    };
}

// As the apps are bundled, the only times they will call require are
// 1. To require native modules
// 2. To require external npm packages we may provide
// 3. To require apps-engine files
function buildRequire(): (module: string) => unknown {
    return (module: string): unknown => {
        if (ALLOWED_NATIVE_MODULES.includes(module)) {
            return require(`node:${module}`);
        }

        if (ALLOWED_EXTERNAL_MODULES.includes(module)) {
            return require(`npm:${module}`);
        }

        if (module.startsWith('@rocket.chat/apps-engine')) {
            // Our `require` function knows how to handle these
            return require(module);
        }

        throw new Error(`Module ${module} is not allowed`);
    };
}

function wrapAppCode(code: string): (require: (module: string) => unknown) => Promise<Record<string, unknown>> {
    return new Function(
        'require',
        `
        const { Buffer } = require('buffer');
        const exports = {};
        const module = { exports };
        const _error = console.error.bind(console);
        const _console = {
            log: _error,
            error: _error,
            debug: _error,
            info: _error,
            warn: _error,
        };

        const result = (async (exports,module,require,Buffer,console,globalThis,Deno) => {
            ${code};
        })(exports,module,require,Buffer,_console,undefined,undefined);

        return result.then(() => module.exports);`,
    ) as (require: (module: string) => unknown) => Promise<Record<string, unknown>>;
}

export default async function handleConstructApp(params: unknown): Promise<boolean> {
    if (!Array.isArray(params)) {
        throw new Error('Invalid params', { cause: 'invalid_param_type' });
    }

    const [appPackage] = params as [IParseAppPackageResult];

    if (!appPackage?.info?.id || !appPackage?.info?.classFile || !appPackage?.files) {
        throw new Error('Invalid params', { cause: 'invalid_param_type' });
    }

    prepareEnvironment();

    AppObjectRegistry.set('id', appPackage.info.id);
    const source = sanitizeDeprecatedUsage(appPackage.files[appPackage.info.classFile]);

    const require = buildRequire();
    const exports = await wrapAppCode(source)(require);

    // This is the same naive logic we've been using in the App Compiler
    // Applying the correct type here is quite difficult because of the dynamic nature of the code
    // deno-lint-ignore no-explicit-any
    const appClass = Object.values(exports)[0] as any;
    const logger = AppObjectRegistry.get('logger');

    const app = new appClass(appPackage.info, logger, AppAccessorsInstance.getDefaultAppAccessors());

    if (typeof app.getName !== 'function') {
        throw new Error('App must contain a getName function');
    }

    if (typeof app.getNameSlug !== 'function') {
        throw new Error('App must contain a getNameSlug function');
    }

    if (typeof app.getVersion !== 'function') {
        throw new Error('App must contain a getVersion function');
    }

    if (typeof app.getID !== 'function') {
        throw new Error('App must contain a getID function');
    }

    if (typeof app.getDescription !== 'function') {
        throw new Error('App must contain a getDescription function');
    }

    if (typeof app.getRequiredApiVersion !== 'function') {
        throw new Error('App must contain a getRequiredApiVersion function');
    }

    AppObjectRegistry.set('app', app);

    return true;
}
