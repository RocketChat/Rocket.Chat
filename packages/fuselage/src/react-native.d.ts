declare module 'react-native' {
	import type { ForwardRefExoticComponent, RefAttributes } from 'react';

	// A stand-in until the repository depends on `react-native`: a component `styled()` takes, whose props are open
	export const Image: ForwardRefExoticComponent<Record<string, unknown> & RefAttributes<unknown>>;
}
