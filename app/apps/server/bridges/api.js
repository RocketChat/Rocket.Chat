import { Meteor } from 'meteor/meteor';
import express from 'express';
import { WebApp } from 'meteor/webapp';

const apiServer = express();

apiServer.disable('x-powered-by');

WebApp.connectHandlers.use(apiServer);

export class AppApisBridge {
	constructor(orch) {
		this.orch = orch;
		this.appRouters = new Map();

		// apiServer.use('/api/apps', (req, res, next) => {
		// 	this.orch.debugLog({
		// 		method: req.method.toLowerCase(),
		// 		url: req.url,
		// 		query: req.query,
		// 		body: req.body,
		// 	});
		// 	next();
		// });

		apiServer.use('/api/apps/private/:appId/:hash', (req, res) => {
			const notFound = () => res.send(404);

			const router = this.appRouters.get(req.params.appId);

			if (router) {
				req._privateHash = req.params.hash;
				return router(req, res, notFound);
			}

			notFound();
		});

		apiServer.use('/api/apps/public/:appId', (req, res) => {
			const notFound = () => res.send(404);

			const router = this.appRouters.get(req.params.appId);

			if (router) {
				return router(req, res, notFound);
			}

			notFound();
		});
	}

	registerApi({ api, computedPath, endpoint }, appId) {
		this.orch.debugLog(`The App ${ appId } is registering the api: "${ endpoint.path }" (${ computedPath })`);

		this._verifyApi(api, endpoint);

		if (!this.appRouters.get(appId)) {
			this.appRouters.set(appId, express.Router()); // eslint-disable-line
		}

		const router = this.appRouters.get(appId);

		const method = api.method || 'all';

		let routePath = endpoint.path.trim();
		if (!routePath.startsWith('/')) {
			routePath = `/${ routePath }`;
		}

		router[method](routePath, Meteor.bindEnvironment(this._appApiExecutor(api, endpoint, appId)));
	}

	unregisterApis(appId) {
		this.orch.debugLog(`The App ${ appId } is unregistering all apis`);

		if (this.appRouters.get(appId)) {
			this.appRouters.delete(appId);
		}
	}

	_verifyApi(api, endpoint) {
		if (typeof api !== 'object') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}

		if (typeof endpoint.path !== 'string') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}
	}

	_appApiExecutor(api, endpoint, appId) {
		return (req, res) => {
			const request = {
				method: req.method.toLowerCase(),
				headers: req.headers,
				query: req.query || {},
				params: req.params || {},
				content: req.body,
				privateHash: req._privateHash,
			};

			this.orch.getManager().getApiManager().executeApi(appId, endpoint.path, request)
				.then(({ status, headers = {}, content }) => {
					res.set(headers);
					res.status(status);
					res.send(content);
				})
				.catch((reason) => {
					// Should we handle this as an error?
					res.status(500).send(reason.message);
				});
		};
	}
}
