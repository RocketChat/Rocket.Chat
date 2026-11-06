import type { IncomingMessage, RequestOptions, ServerResponse } from 'http';
import http from 'http';
import url from 'url';

import type polka from 'polka';

const isProdEnv = process.env.NODE_ENV === 'production';

const skipProxyPaths = [/^\/sockjs\/info\?cb=/, /^\/health/];

export function proxy(): (req: IncomingMessage, res: ServerResponse, next: polka.Next) => void {
	if (isProdEnv) {
		return (_req, _res, next) => next();
	}

	return (req, res, next) => {
		if (skipProxyPaths.some((regex) => regex.test(req.url || ''))) {
			return next();
		}

		req.pause();

		const options: RequestOptions = url.parse(req.url || '');
		options.headers = req.headers;
		options.method = req.method;
		options.agent = false;
		options.hostname = 'localhost';
		options.port = 3000;

		const connector = http.request(options, function (serverResponse) {
			serverResponse.pause();
			if (serverResponse.statusCode) {
				res.writeHead(serverResponse.statusCode, serverResponse.headers);
			}
			serverResponse.pipe(res);
			serverResponse.resume();
		});
		req.pipe(connector);
		req.resume();
	};
}
