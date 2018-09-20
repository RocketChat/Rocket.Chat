import express from 'express';
import { WebApp } from 'meteor/webapp';

const apiServer = express();
WebApp.connectHandlers.use(apiServer);

export class AppApisBridge {
	constructor(orch) {
		this.orch = orch;
		this.appRouters = new Map();

		apiServer.use('/apps/private/:appId/:hash', (req, res) => {
			const notFound = () => res.send(404);

			const router = this.appRouters.get(req.params.appId);

			if (router) {
				req._privateHash = req.params.hash;
				return router(req, res, notFound);
			}

			notFound();
		});

		apiServer.use('/apps/public/:appId', (req, res) => {
			const notFound = () => res.send(404);

			const router = this.appRouters.get(req.params.appId);

			if (router) {
				return router(req, res, notFound);
			}

			notFound();
		});
	}

	registerApi({ api, computedPath }, appId) {
		console.log(`The App ${ appId } is registering the api: "${ api.path }" (${ computedPath })`);

		this._verifyApi(api);

		if (!this.appRouters.get(appId)) {
			this.appRouters.set(appId, express.Router()); // eslint-disable-line
		}

		const router = this.appRouters.get(appId);

		const method = api.method || 'all';

		let routePath = api.path.trim();
		if (!routePath.startsWith('/')) {
			routePath = `/${ routePath }`;
		}

		router[method](routePath, Meteor.bindEnvironment(this._appApiExecutor(api, appId)));
	}

	unregisterApis(appId) {
		console.log(`The App ${ appId } is unregistering all apis`);

		if (this.appRouters.get(appId)) {
			this.appRouters.delete(appId);
		}
	}

	_verifyApi(api) {
		if (typeof api !== 'object') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}

		if (typeof api.path !== 'string') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}
	}

	_appApiExecutor(api, appId) {
		return (req, res) => {
			const request = {
				method: req.method.toLowerCase(),
				headers: req.headers,
				query: req.query || {},
				params: req.params || {},
				content: req.body,
				privateHash: req._privateHash,
			};

			this.orch.getManager().getApiManager().executeApi(appId, api.path, request)
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
