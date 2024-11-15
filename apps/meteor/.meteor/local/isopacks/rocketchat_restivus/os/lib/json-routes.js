import { WebApp } from 'meteor/webapp';

const connect = Npm.require('connect');
const connectRoute = Npm.require('connect-route');

WebApp.connectHandlers.use(connect.urlencoded({ limit: '50mb' })); // Override default request size
WebApp.connectHandlers.use(connect.json({ limit: '50mb' })); // Override default request size
WebApp.connectHandlers.use(connect.query());

// Save reference to router for later
let connectRouter;

const responseHeaders = {
	'Cache-Control': 'no-store',
	'Pragma': 'no-cache',
};

// Register as a middleware
WebApp.connectHandlers.use(
	connectRoute(function (router) {
		connectRouter = router;
	}),
);

function setHeaders(res, headers) {
	Object.entries(headers).forEach(([key, value]) => {
		res.setHeader(key, value);
	});
}

export const JsonRoutes = {
	add(method, path, handler) {
		// Make sure path starts with a slash
		if (path[0] !== '/') {
			path = `/${path}`;
		}

		connectRouter[method.toLowerCase()](path, async (req, res, next) => {
			// Set headers on response
			setHeaders(res, responseHeaders);

			try {
				await handler(req, res, next);
			} catch (error) {
				next(error);
			}
		});
	},
};
