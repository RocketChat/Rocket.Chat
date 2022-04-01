declare module 'meteor/url' {
	export const URL: typeof globalThis.URL & {
		_constructUrl(url: string, query?: string, paramsForUrl?: Record<string, string>): string;
	};
	export const URLSearchParams: typeof globalThis.URLSearchParams;
}
