import type { WattRuntimeModule } from './WattRuntimeApi';

/**
 * Dynamically loads Platformatic Watt's programmatic runtime API.
 *
 * `@platformatic/runtime` is an *optional* dependency: the default Apps-Engine
 * runtime still spawns a Node subprocess per app, and only deployments that opt
 * into the Watt runtime need the package installed. To keep the package build
 * green without it, the import is performed at runtime through an indirection
 * that TypeScript/bundlers cannot statically resolve, and the module is typed
 * against our own {@link WattRuntimeModule} contract.
 */
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func -- deliberate dynamic ESM import of an optional dependency
const importWatt = new Function('return import("@platformatic/runtime")') as () => Promise<unknown>;

let cached: Promise<WattRuntimeModule> | undefined;

export function loadWattRuntime(): Promise<WattRuntimeModule> {
	if (!cached) {
		cached = importWatt()
			.then((mod) => mod as WattRuntimeModule)
			.catch((error) => {
				cached = undefined;
				throw new Error(
					`The Watt runtime requires the optional dependency "@platformatic/runtime" to be installed. Original error: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
			});
	}

	return cached;
}
