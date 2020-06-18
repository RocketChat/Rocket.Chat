declare module '@rocket.chat/fuselage-hooks' {
	import { RefObject } from 'react';

	export const useDebouncedCallback: (fn: (...args: any[]) => any, ms: number, deps: any[]) => (...args: any[]) => any;
	export const useLazyRef: <T>(initializer: () => T) => RefObject<T>;
	export const useMutableCallback: (fn: (...args: any[]) => any) => (...args: any[]) => any;
}
