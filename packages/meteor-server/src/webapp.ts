import http from 'node:http';

import express from 'express';

/**
 * Express-backed port of meteor/webapp (Meteor 3's webapp is itself express-based).
 *
 * Middleware order matches Meteor: rawHandlers/rawConnectHandlers run before
 * handlers/connectHandlers. The entrypoint calls `startWebApp()` once the app
 * finished registering handlers.
 */

const app = express();
app.disable('x-powered-by');

const rawHandlers = express();
const handlers = express();

app.use(rawHandlers);
app.use(handlers);

const httpServer = http.createServer(app);

export const startWebApp = async (port: number | string = process.env.PORT || 3000): Promise<http.Server> => {
	return new Promise((resolve, reject) => {
		httpServer.once('error', reject);
		httpServer.listen(Number(port), () => {
			httpServer.off('error', reject);
			resolve(httpServer);
		});
	});
};

export const WebApp = {
	/** The express app every request goes through first (Meteor: rawConnectHandlers/rawHandlers). */
	rawHandlers,
	rawConnectHandlers: rawHandlers,

	/** The main express app (Meteor: connectHandlers/handlers). */
	handlers,
	connectHandlers: handlers,

	/** The underlying express app, exposed for the entrypoint. */
	expressApp: app,

	httpServer,

	/**
	 * Meteor fills this with the built client programs (web.browser, etc.).
	 * The vite build serves the client instead; entries are registered by the
	 * entrypoint when it wires up client asset serving.
	 */
	clientPrograms: {} as Record<string, unknown>,

	categorizeRequest(req: http.IncomingMessage): { browser: { name: string; major: number }; arch: string; path: string; url: URL } {
		return {
			browser: { name: 'unknown', major: 0 },
			arch: 'web.browser',
			path: req.url || '/',
			url: new URL(req.url || '/', 'http://localhost'),
		};
	},
};

let bundledJsCssPrefix: string | undefined;
let inlineScriptsAllowed = true;

export const WebAppInternals = {
	/** Meteor regenerates the HTML boilerplate; the vite client build has no boilerplate to regenerate. */
	async generateBoilerplate(): Promise<void> {
		// no-op: the client is built and served by vite, not by the boilerplate generator
	},

	setBundledJsCssPrefix(prefix: string): void {
		bundledJsCssPrefix = prefix;
	},

	getBundledJsCssPrefix(): string | undefined {
		return bundledJsCssPrefix;
	},

	setInlineScriptsAllowed(allowed: boolean): void {
		inlineScriptsAllowed = allowed;
	},

	inlineScriptsAllowed(): boolean {
		return inlineScriptsAllowed;
	},

	staticFilesMiddleware(_staticFiles: unknown, _req: http.IncomingMessage, _res: http.ServerResponse, next: () => void): void {
		next();
	},

	staticFiles: {} as Record<string, unknown>,
};
