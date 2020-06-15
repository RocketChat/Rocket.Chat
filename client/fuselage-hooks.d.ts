declare module '@rocket.chat/fuselage-hooks' {
	export const useDebouncedCallback: (fn: (...args: any[]) => any, ms: number, deps: any[]) => (...args: any[]) => any;
	export const useMutableCallback: (fn: (...args: any[]) => any) => (...args: any[]) => any;
}
