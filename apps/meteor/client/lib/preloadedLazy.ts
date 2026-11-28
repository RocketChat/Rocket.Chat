import type { ComponentType, LazyExoticComponent } from 'react';
import { lazy } from 'react';

/**
 * `lazy()` for a component every session renders early: its chunk starts loading as soon as this module runs, and
 * once it has loaded the component renders without suspending. A component that suspends shows its Suspense
 * fallback, and React then holds the content back for up to 300 ms after that fallback appeared.
 */
export const preloadedLazy = <T extends ComponentType<any>>(load: () => Promise<{ default: T }>): LazyExoticComponent<T> => {
	let loaded: { default: T } | undefined;
	const loading = load().then((module) => {
		loaded = module;
		return module;
	});
	// a failed load surfaces when the component renders, like with `lazy()`, not as an unhandled rejection before that
	loading.catch(() => undefined);

	return lazy(() => {
		const module = loaded;
		if (!module) {
			return loading;
		}

		// React reads a module from a thenable that settles synchronously without suspending
		return { then: (resolve: (value: { default: T }) => void) => resolve(module) } as Promise<{ default: T }>;
	});
};
