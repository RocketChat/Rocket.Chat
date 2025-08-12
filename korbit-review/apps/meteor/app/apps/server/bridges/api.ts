import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { RequestMethod } from '@rocket.chat/apps-engine/definition/accessors';
import type { IApiRequest, IApiEndpoint, IApi } from '@rocket.chat/apps-engine/definition/api';
import { ApiBridge } from '@rocket.chat/apps-engine/server/bridges/ApiBridge';
import type { AppApi } from '@rocket.chat/apps-engine/server/managers/AppApi';
import type { Response, Request, IRouter, RequestHandler } from 'express';
import express from 'express';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { apiServer } from './router';
import { authenticationMiddleware } from '../../../api/server/middlewares/authentication';

WebApp.rawConnectHandlers.use(apiServer);

interface IRequestWithPrivateHash extends Request {
	_privateHash?: string;
	content?: any;
}

export class AppApisBridge extends ApiBridge {
	appRouters: Map<string, IRouter>;

	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
		this.appRouters = new Map();

		apiServer.use('/api/apps/private/:appId/:hash', (req: IRequestWithPrivateHash, res: Response) => {
			const notFound = (): Response => res.sendStatus(404);

			const router = this.appRouters.get(req.params.appId);

			if (router) {
				req._privateHash = req.params.hash;
				return router(req, res, notFound);
			}

			notFound();
		});

		apiServer.use('/api/apps/public/:appId', (req: Request, res: Response) => {
			const notFound = (): Response => res.sendStatus(404);

			const router = this.appRouters.get(req.params.appId);

			if (router) {
				return router(req, res, notFound);
			}

			notFound();
		});
	}

	public async registerApi({ api, computedPath, endpoint }: AppApi, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is registering the api: "${endpoint.path}" (${computedPath})`);

		this._verifyApi(api, endpoint);

		let router = this.appRouters.get(appId);

		if (!router) {
			router = express.Router(); // eslint-disable-line new-cap
			this.appRouters.set(appId, router);
		}

		const method = 'all';

		let routePath = endpoint.path.trim();
		if (!routePath.startsWith('/')) {
			routePath = `/${routePath}`;
		}

		if (router[method] instanceof Function) {
			router[method](
				routePath,
				authenticationMiddleware({ rejectUnauthorized: !!endpoint.authRequired }),
				Meteor.bindEnvironment(this._appApiExecutor(endpoint, appId)),
			);
		}
	}

	public async unregisterApis(appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is unregistering all apis`);

		if (this.appRouters.get(appId)) {
			this.appRouters.delete(appId);
		}
	}

	private _verifyApi(api: IApi, endpoint: IApiEndpoint): void {
		if (typeof api !== 'object') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}

		if (typeof endpoint.path !== 'string') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}
	}

	private _appApiExecutor(endpoint: IApiEndpoint, appId: string): RequestHandler {
		return (req: IRequestWithPrivateHash, res: Response): void => {
			const request: IApiRequest = {
				method: req.method.toLowerCase() as RequestMethod,
				headers: req.headers as { [key: string]: string },
				query: (req.query as { [key: string]: string }) || {},
				params: req.params || {},
				content: req.body,
				privateHash: req._privateHash,
				user: req.user && this.orch.getConverters()?.get('users')?.convertToApp(req.user),
			};

			this.orch
				.getManager()
				?.getApiManager()
				.executeApi(appId, endpoint.path, request)
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
