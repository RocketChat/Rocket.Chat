import { mintApp, type App } from './brand';
import type { AppBuilder } from './builder';
import type { AppSetupContext } from './context';

/**
 * The factory an author exports as the module default (0001 §1). It mutates the `AppBuilder` and
 * may do setup-time I/O. The driver (embedded runtime, or remote `connect`) invokes it; because it
 * may run more than once, it must be free of one-time side effects.
 */
export type AppSetup = (app: AppBuilder, ctx: AppSetupContext) => void | Promise<void>;

/**
 * The single entry point. Consumes a typed `setup` factory and mints a branded {@link App} — the
 * only way to produce one (0001 §2).
 */
export function defineApp(setup: AppSetup): App {
	return mintApp(setup);
}
