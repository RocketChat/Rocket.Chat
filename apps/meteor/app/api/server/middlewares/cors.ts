import type { MiddlewareHandler } from 'hono';

import type { CachedSettings } from '../../../settings/server/CachedSettings';

const defaultHeaders = {
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, PATCH',
	'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token, x-visitor-token, Authorization',
};

export const cors =
	(settings: CachedSettings): MiddlewareHandler =>
	async (c, next) => {
		const { req, res } = c;
		if (req.method !== 'OPTIONS') {
			if (settings.get('API_Enable_CORS')) {
				res.headers.set('Vary', 'Origin');
				res.headers.set('Access-Control-Allow-Methods', defaultHeaders['Access-Control-Allow-Methods']);
				res.headers.set('Access-Control-Allow-Headers', defaultHeaders['Access-Control-Allow-Headers']);
			}

			await next();
			return;
		}

		// check if a pre-flight request
		if (!req.header('access-control-request-method') && !req.header('origin')) {
			await next();
			return;
		}

		if (!settings.get('API_Enable_CORS')) {
			return c.body('CORS not enabled. Go to "Admin > General > REST Api" to enable it.', 405);
		}

		const CORSOriginSetting = String(settings.get('API_CORS_Origin'));

		if (CORSOriginSetting === '*') {
			res.headers.set('Access-Control-Allow-Origin', '*');
			res.headers.set('Access-Control-Allow-Methods', defaultHeaders['Access-Control-Allow-Methods']);
			res.headers.set('Access-Control-Allow-Headers', defaultHeaders['Access-Control-Allow-Headers']);
			await next();
			return;
		}

		const origins = CORSOriginSetting.trim()
			.split(',')
			.map((origin) => String(origin).trim().toLocaleLowerCase());

		const originHeader = req.header('origin');

		// if invalid origin reply without required CORS headers
		if (!originHeader || !origins.includes(originHeader)) {
			return c.body('Invalid origin', 403);
		}

		res.headers.set('Vary', 'Origin');
		res.headers.set('Access-Control-Allow-Origin', originHeader);
		res.headers.set('Access-Control-Allow-Methods', defaultHeaders['Access-Control-Allow-Methods']);
		res.headers.set('Access-Control-Allow-Headers', defaultHeaders['Access-Control-Allow-Headers']);
		await next();
	};
