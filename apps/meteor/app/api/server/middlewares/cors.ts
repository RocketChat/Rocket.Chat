import type { NextFunction, Request, Response } from 'express';

import type { CachedSettings } from '../../../settings/server/CachedSettings';

export const cors = (settings: CachedSettings) => (req: Request, res: Response, next: NextFunction) => {
	if (!settings.get('API_Enable_CORS')) {
		return next();
	}

	if (!req.headers['access-control-request-method'] && !req.headers.origin) {
		return next();
	}

	const CORSOriginSetting = String(settings.get('API_CORS_Origin'));

	const defaultHeaders = {
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, HEAD, PATCH',
		'Access-Control-Allow-Headers':
			'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token, x-visitor-token, Authorization',
	};

	if (CORSOriginSetting === '*') {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', defaultHeaders['Access-Control-Allow-Methods']);
		res.setHeader('Access-Control-Allow-Headers', defaultHeaders['Access-Control-Allow-Headers']);
		return next();
	}

	const origins = CORSOriginSetting.trim()
		.split(',')
		.map((origin) => String(origin).trim().toLocaleLowerCase());

	if (!origins.includes(req.headers.origin?.toLocaleLowerCase() || '')) {
		res.writeHead(403, 'Forbidden');
		return res.end();
	}

	res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
	res.setHeader('Access-Control-Allow-Methods', defaultHeaders['Access-Control-Allow-Methods']);
	res.setHeader('Access-Control-Allow-Headers', defaultHeaders['Access-Control-Allow-Headers']);
	return next();
};
