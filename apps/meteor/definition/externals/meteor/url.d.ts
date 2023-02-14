declare module 'meteor/url' {
	export const URL: typeof window.URL & {
		_constructUrl(url: string, query?: string, paramsForUrl?: Record<string, string>): string;
	};
	export const URLSearchParams: typeof window.URLSearchParams;
}
