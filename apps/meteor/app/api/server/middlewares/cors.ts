import type { NextFunction, Request, Response } from 'express';

import type { CachedSettings } from '../../../settings/server/CachedSettings';

const defaultHeaders = {
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, PATCH',
	'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token, x-visitor-token, Authorization',
};

export const cors = (settings: CachedSettings) => (req: Request, res: Response, next: NextFunction) => {
	if (req.method !== 'OPTIONS') {
		if (settings.get('API_Enable_CORS')) {
			res.setHeader('Vary', 'Origin');
			res.setHeader('Access-Control-Allow-Methods', defaultHeaders['Access-Control-Allow-Methods']);
			res.setHeader('Access-Control-Allow-Headers', defaultHeaders['Access-Control-Allow-Headers']);
		}

		next();
		return;
	}

	// check if a pre-flight request
	if (!req.headers['access-control-request-method'] && !req.headers.origin) {
		next();
		return;
	}

	if (!settings.get('API_Enable_CORS')) {
		res.writeHead(405);
		res.write('CORS not enabled. Go to "Admin > General > REST Api" to enable it.');
		res.end();
		return;
	}

	const CORSOriginSetting = String(settings.get('API_CORS_Origin'));

	if (CORSOriginSetting === '*') {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', defaultHeaders['Access-Control-Allow-Methods']);
		res.setHeader('Access-Control-Allow-Headers', defaultHeaders['Access-Control-Allow-Headers']);
		next();
		return;
	}

	const origins = CORSOriginSetting.trim()
		.split(',')
		.map((origin) => String(origin).trim().toLocaleLowerCase());

	// if invalid origin reply without required CORS headers
	if (!req.headers.origin || !origins.includes(req.headers.origin)) {
		res.writeHead(403, 'Forbidden');
		res.end();
		return;
	}

	res.setHeader('Vary', 'Origin');
	res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
	res.setHeader('Access-Control-Allow-Methods', defaultHeaders['Access-Control-Allow-Methods']);
	res.setHeader('Access-Control-Allow-Headers', defaultHeaders['Access-Control-Allow-Headers']);
	next();
};
