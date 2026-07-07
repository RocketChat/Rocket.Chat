import type { IParseAppPackageResult } from '@rocket.chat/apps/dist/server/compiler/IParseAppPackageResult';
import type { App } from '@rocket.chat/apps-engine/definition/App';

import { AppObjectRegistry } from '../../AppObjectRegistry';
import { AppAccessorsInstance } from '../../lib/accessors/mod';
import type { RequestContext } from '../../lib/requestContext';
import { sanitizeDeprecatedUsage } from '../../lib/sanitizeDeprecatedUsage';

/**
 * A platform-dependent `require` used to resolve the modules an app is allowed
 * to load (native `node:` modules, a small allow-list of npm packages, and
 * apps-engine files). Each runtime injects its own via {@link setSandboxRequire}
 * — Node hands over its global `require`, Deno hands over its `createRequire`
 * shim that knows how to resolve compiled apps-engine paths.
 */
type SandboxRequire = (module: string) => unknown;

function defaultSandboxRequire(): never {
	throw new Error('No sandbox require has been injected; the runtime adapter must call setSandboxRequire() during bootstrap');
}

let sandboxRequire: SandboxRequire = defaultSandboxRequire;

export function setSandboxRequire(newRequire: SandboxRequire): void {
	sandboxRequire = newRequire;
}

/**
 * Extra globals bound into the app's eval shell on top of the common ones
 * (`exports`, `module`, `require`, `console`, `globalThis`). Node needs none;
 * Deno injects a `Buffer` and shadows `Deno` with `undefined`. Injecting them
 * as data keeps the eval-shell skeleton single-source.
 */
type SandboxGlobals = Record<string, unknown>;

let sandboxGlobals: SandboxGlobals = {};

export function setSandboxGlobals(globals: SandboxGlobals): void {
	sandboxGlobals = globals;
}

function wrapAppCode(code: string): (require: SandboxRequire) => Promise<Record<string, unknown>> {
	const globals = sandboxGlobals;
	// The common globals are bound by name; any platform-specific extras are
	// spread in by name from the injected `sandboxGlobals`, so the shell
	// skeleton stays identical across runtimes.
	const extraNames = Object.keys(globals);
	const extraParams = extraNames.length ? `,${extraNames.join(',')}` : '';
	const extraArgs = extraNames.map((name) => `,__globals[${JSON.stringify(name)}]`).join('');

	// eslint-disable-next-line @typescript-eslint/no-implied-eval -- This is the reason we run in a separate process
	const fn = new Function(
		'require',
		'__globals',
		`
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

        const result = (async (exports,module,require,console,globalThis${extraParams}) => {
            ${code};
        })(exports,module,require,_console,undefined${extraArgs});

        return result.then(() => module.exports);`,
	) as (require: SandboxRequire, globals: SandboxGlobals) => Promise<Record<string, unknown>>;

	return (require: SandboxRequire) => fn(require, globals);
}

type AppConstructor = new (...args: unknown[]) => App;

export default async function handleConstructApp(request: RequestContext): Promise<boolean> {
	const { params } = request;

	if (!Array.isArray(params)) {
		throw new Error('Invalid params', { cause: 'invalid_param_type' });
	}

	const [appPackage] = params as [IParseAppPackageResult];

	if (!appPackage?.info?.id || !appPackage?.info?.classFile || !appPackage?.files) {
		throw new Error('Invalid params', { cause: 'invalid_param_type' });
	}

	AppObjectRegistry.set('id', appPackage.info.id);
	const source = sanitizeDeprecatedUsage(appPackage.files[appPackage.info.classFile]);

	const exports = await wrapAppCode(source)(sandboxRequire);

	// This is the same naive logic we've been using in the App Compiler
	// Applying the correct type here is quite difficult because of the dynamic nature of the code
	const appClass = Object.values(exports)[0] as AppConstructor;

	const app = new appClass(appPackage.info, request.context.logger, AppAccessorsInstance.getDefaultAppAccessors());

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
