declare module 'react' {
	export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
}

declare module 'react/jsx-runtime' {
	export {};
}

declare module '@rocket.chat/ui-contexts' {
	export type TranslationKey = string;
	export function useSetting<TValue = unknown>(settingId: string, fallbackValue?: TValue): TValue;
	export function useUserPreference<TValue = unknown>(key: string, defaultValue?: TValue): TValue | undefined;
}

declare module '@rocket.chat/mock-providers' {
	export const mockAppRoot: any;
}

declare module '@testing-library/react' {
	export const renderHook: any;
}

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: (...args: any[]) => any) => void;
declare const test: (name: string, fn: (...args: any[]) => any) => void;
declare const expect: any;
declare const beforeAll: (fn: (...args: any[]) => any) => void;
declare const beforeEach: (fn: (...args: any[]) => any) => void;
declare const afterAll: (fn: (...args: any[]) => any) => void;
declare const afterEach: (fn: (...args: any[]) => any) => void;
