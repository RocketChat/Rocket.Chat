declare module 'meteor/url' {
	const URL: typeof window.URL & {
		_constructUrl(url: string, query?: string, paramsForUrl?: Record<string, string>): string;
	};
	const URLSearchParams: typeof window.URLSearchParams;
}
