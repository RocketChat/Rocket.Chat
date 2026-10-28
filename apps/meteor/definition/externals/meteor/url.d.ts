declare module 'meteor/url' {
	const URL: typeof window.URL & {
		_constructUrl(url: string, query?: string, paramsForUrl?: Record<string, string>): string;
	};
}
