import { WebApp } from 'meteor/webapp';
import express from 'express';

import { API } from '../api';
import { authenticationMiddleware } from '../middlewares/authentication';

const apiServer = express();

apiServer.disable('x-powered-by');

WebApp.connectHandlers.use(apiServer);

// eslint-disable-next-line new-cap
const router = express.Router();

router.get('/non-auth-sync', (req, res) => {
	res.json({ sucess: true, data: 'string' });
});

router.get('/non-auth-async', async (req, res) => {
	res.json(await Promise.resolve({ sucess: true, data: 'string' }));
});

router.get('/auth-sync', authenticationMiddleware({ rejectUnauthorized: true }), (req, res) => {
	res.json({ sucess: true, data: 'string' });
});

router.get('/auth-async', authenticationMiddleware({ rejectUnauthorized: true }), async (req, res) => {
	res.json(await Promise.resolve({ sucess: true, data: 'string' }));
});

router.get('/me', authenticationMiddleware({ rejectUnauthorized: true }), async (req, res) => {
	res.json(await Promise.resolve({ sucess: true, user: req.user }));
});

apiServer.use('/api/v1/perf/express/', router).listen(3030);

WebApp.connectHandlers.use('/api/v1/perf/connect/non-auth-sync', (req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ sucess: true, data: 'string' }));
});

WebApp.connectHandlers.use('/api/v1/perf/connect/non-auth-async', async (req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(await Promise.resolve({ sucess: true, data: 'string' })));
});

WebApp.connectHandlers.use('/api/v1/perf/connect/auth-sync', authenticationMiddleware({ rejectUnauthorized: true }));
WebApp.connectHandlers.use('/api/v1/perf/connect/auth-sync', (req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ sucess: true, data: 'string' }));
});

WebApp.connectHandlers.use('/api/v1/perf/connect/auth-async', authenticationMiddleware({ rejectUnauthorized: true }));
WebApp.connectHandlers.use('/api/v1/perf/connect/auth-async', async (req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ sucess: true, data: 'string' }));
});

WebApp.connectHandlers.use('/api/v1/perf/connect/me', authenticationMiddleware({ rejectUnauthorized: true }));
WebApp.connectHandlers.use('/api/v1/perf/connect/me', async (req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ sucess: true, user: req.user }));
});

API.v1.addRoute(
	'perf/restivus/auth-sync',
	{ authRequired: true },
	{
		get() {
			return API.v1.success({ data: 'string' });
		},
	},
);

API.v1.addRoute(
	'perf/restivus/non-auth-sync',
	{ authRequired: false },
	{
		get() {
			return API.v1.success({ data: 'string' });
		},
	},
);

API.v1.addRoute(
	'perf/restivus/auth-async',
	{ authRequired: true },
	{
		async get() {
			return API.v1.success(await Promise.resolve({ data: 'string' }));
		},
	},
);

API.v1.addRoute(
	'perf/restivus/non-auth-async',
	{ authRequired: false },
	{
		async get() {
			return API.v1.success(await Promise.resolve({ data: 'string' }));
		},
	},
);
