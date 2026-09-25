declare module 'meteor/webapp' {
	import type { IncomingMessage } from 'node:http';
	import type { UrlWithParsedQuery } from 'node:url';

	import type * as express from 'express';

	namespace WebApp {
		// Present in Meteor 3's generated types but missing from @types/meteor.
		const rawHandlers: express.Application;

		function setInlineScriptsAllowed(allowed: boolean): Promise<void>;

		function categorizeRequest(req: IncomingMessage): { arch: string; path: string; url: UrlWithParsedQuery } & Record<string, unknown>;
	}
}
