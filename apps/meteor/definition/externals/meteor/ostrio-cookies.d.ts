declare module 'meteor/ostrio:cookies' {
	class Cookies {
		constructor(opts?: {
			TTL?: number | false;
			auto?: boolean;
			handler?: (cookies: Cookies) => void;
			runOnServer?: boolean;
			allowQueryStringCookies?: boolean;
			allowedCordovaOrigins?: RegExp | boolean;
		});

		middleware(): (req: Request, res: Response, next: () => void) => void;

		get(key: string, _tmp?: string): string | undefined;
	}
}
