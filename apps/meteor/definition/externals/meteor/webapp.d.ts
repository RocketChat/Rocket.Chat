declare module 'meteor/webapp' {
	import type { IncomingMessage, Server, ServerResponse } from 'node:http';
	import type { ListenOptions } from 'node:net';
	import type { UrlWithParsedQuery } from 'node:url';

	import type * as express from 'express';

	namespace WebApp {
		// Present in Meteor 3's generated types but missing from @types/meteor.
		const rawHandlers: express.Application;

		function setInlineScriptsAllowed(allowed: boolean): Promise<void>;

		// Meteor documents it as overridable, to change how the server listens.
		let startListening: (httpServer: Server, listenOptions: ListenOptions, cb: () => void) => void;

		const _timeoutAdjustmentRequestCallback: (req: IncomingMessage, res: ServerResponse) => void;

		function categorizeRequest(req: IncomingMessage): { arch: string; path: string; url: UrlWithParsedQuery } & Record<string, unknown>;
	}
}
