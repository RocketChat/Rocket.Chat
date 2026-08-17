import fs from 'node:fs/promises';
import path from 'node:path';

import express from 'express';

import { applyHtmlInjections } from './inject-initial.ts';
import { WebApp, WebAppInternals } from './webapp.ts';

/**
 * Serves the vite-built client, replacing what Meteor's `webapp` did with the
 * client program bundle.
 *
 * Meteor generated an HTML boilerplate per architecture and served it for any
 * unmatched route; here the boilerplate is the `index.html` vite emitted, with
 * Rocket.Chat's head/body injections applied at request time (favicons, custom
 * CSS/JS, referrer policy — see `server/lib/ui-master`).
 *
 * Mounted *after* the app's own handlers, so `/api`, `/avatar`, `/file-upload`
 * and the rest still win; only routes nothing else claimed fall through to the
 * SPA entry.
 */

export type ServeClientOptions = {
	/** Directory holding the vite client build (index.html + assets) */
	clientDir: string;
};

const IMMUTABLE = 'public, max-age=31536000, immutable';

const RUNTIME_CONFIG_PATH = '/meteor_runtime_config.js';

/**
 * The vite build inlines a script defining `__meteor_runtime_config__`, but
 * Rocket.Chat's CSP (`Enable_CSP`) sets `script-src` without `unsafe-inline`,
 * so the browser refuses to run it and the client never boots.
 *
 * Meteor solved this the same way: with `inlineScriptsAllowed()` false it moves
 * the runtime config out to `/meteor_runtime_config.js` and references it by
 * `src`, which `'self'` permits (webapp_server.js). Do the same, and keep the
 * inline version for when inline scripts are allowed.
 */
const splitRuntimeConfig = (html: string): { html: string; externalHtml: string; runtimeConfigJs?: string } => {
	const match = /<script[^>]*>((?:(?!<\/script>)[\s\S])*__meteor_runtime_config__(?:(?!<\/script>)[\s\S])*)<\/script>/.exec(html);

	if (!match) {
		return { html, externalHtml: html };
	}

	return {
		html,
		externalHtml: html.replace(match[0], `<script type="text/javascript" src="${RUNTIME_CONFIG_PATH}"></script>`),
		runtimeConfigJs: match[1],
	};
};

export const serveClient = async ({ clientDir }: ServeClientOptions): Promise<void> => {
	const root = path.resolve(clientDir);
	const indexPath = path.join(root, 'index.html');

	try {
		await fs.access(indexPath);
	} catch {
		throw new Error(`No client build found at ${indexPath} — run \`yarn vite build\` in apps/meteor first`);
	}

	const { html: inlineHtml, externalHtml, runtimeConfigJs } = splitRuntimeConfig(await fs.readFile(indexPath, 'utf-8'));

	const router = express.Router();

	if (runtimeConfigJs) {
		router.get(RUNTIME_CONFIG_PATH, (_req, res) => {
			res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
			res.setHeader('Cache-Control', 'no-store');
			res.send(runtimeConfigJs);
		});
	}

	// Content-addressed assets can be cached forever; everything else is
	// revalidated so a redeploy is picked up.
	router.use(
		express.static(root, {
			index: false,
			setHeaders(res, filePath) {
				res.setHeader('Cache-Control', filePath.includes(`${path.sep}static${path.sep}`) ? IMMUTABLE : 'public, max-age=0, must-revalidate');
			},
		}),
	);

	router.get('*', async (req, res, next) => {
		// Anything that isn't a page navigation and wasn't found above is a
		// genuine 404 rather than a client-side route.
		if (!req.accepts('html')) {
			next();
			return;
		}

		try {
			const html = WebAppInternals.inlineScriptsAllowed() ? inlineHtml : externalHtml;
			res.setHeader('Content-Type', 'text/html; charset=utf-8');
			res.setHeader('Cache-Control', 'no-store');
			res.send(await applyHtmlInjections(html, req, res));
		} catch (err) {
			next(err);
		}
	});

	WebApp.expressApp.use(router);
};
