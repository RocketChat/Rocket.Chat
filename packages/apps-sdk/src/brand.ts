import type { AppSetup } from './defineApp';

declare const appBrand: unique symbol;

/**
 * Opaque, unforgeable handle to a resolved app. Authors cannot construct one — `defineApp` is the
 * only mint (0001 §2). The type carries no usable runtime shape; the runtime brand-check below is
 * the enforcement TypeScript can't provide.
 */
export type App = { readonly [appBrand]: 'ResolvedApp' };

/**
 * Runtime brand. A module-level symbol (not `Symbol.for`) so it is shared only via this module
 * instance and cannot be forged from app code. The app bundle and the worker resolve the *same*
 * `@rocket.chat/apps-sdk` instance (0005 §5), so this identity check holds across the vm boundary.
 */
const APP_BRAND = Symbol('rocketchat.apps.App.v2');

type ResolvedApp = {
	readonly [APP_BRAND]: true;
	readonly setup: AppSetup;
};

export function mintApp(setup: AppSetup): App {
	const app: ResolvedApp = { [APP_BRAND]: true, setup };
	return app as unknown as App;
}

/** Internal — runtime load-time guard (0001 §2): "you used `defineApp` at all". */
export function isApp(value: unknown): value is App {
	return typeof value === 'object' && value !== null && (value as Partial<ResolvedApp>)[APP_BRAND] === true;
}

/** Internal — the runtime driver reads the factory back to invoke it (0001 §1). */
export function getSetup(app: App): AppSetup {
	return (app as unknown as ResolvedApp).setup;
}
