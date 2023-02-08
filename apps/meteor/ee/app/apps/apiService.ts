import type { RequestMethod } from '@rocket.chat/apps-engine/definition/accessors';
import type { IApiEndpoint, IApiRequest } from '@rocket.chat/apps-engine/definition/api';
import { Router } from 'express';
import type { Request, Response, IRouter, RequestHandler } from 'express';
import type { NextFunction } from 'connect';

import type { IAppsApiService, IRequestWithPrivateHash } from '../../../server/sdk/types/IAppsApiService';
import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import type { AppServerOrchestrator } from './orchestrator';
import { OrchestratorFactory } from './orchestratorFactory';

export class AppsApiService extends ServiceClass implements IAppsApiService {
	protected name = 'apps';

	private apps: AppServerOrchestrator;

	protected appRouters: Map<string, IRouter>;

	constructor() {
		super();
		this.appRouters = new Map();
		this.apps = OrchestratorFactory.getOrchestrator();
	}

	async handlePublicRequest(req: Request, res: Response): Promise<void> {
		const notFound = (): Response => res.sendStatus(404);

		const router = this.appRouters.get(req.params.appId);

		if (router) {
			return router(req, res, notFound);
		}

		notFound();
	}

	async handlePrivateRequest(req: IRequestWithPrivateHash, res: Response): Promise<void> {
		const notFound = (): Response => res.sendStatus(404);

		const router = this.appRouters.get(req.params.appId);

		if (router) {
			req._privateHash = req.params.hash;
			return router(req, res, notFound);
		}

		notFound();
	}

	registerApi(endpoint: IApiEndpoint, appId: string): void {
		let router = this.appRouters.get(appId);

		if (!router) {
			// eslint-disable-next-line new-cap
			router = Router();
			this.appRouters.set(appId, router);
		}

		const method = 'all';

		let routePath = endpoint.path.trim();
		if (!routePath.startsWith('/')) {
			routePath = `/${routePath}`;
		}

		if (router[method] instanceof Function) {
			router[method](routePath, this.authMiddleware(!!endpoint.authRequired), this._appApiExecutor(endpoint, appId));
		}
	}

	private authMiddleware(authRequired: boolean) {
		return (req: Request, res: Response, next: NextFunction): void => {
			if (!req.user && authRequired) {
				res.status(401).send('Unauthorized');
				return;
			}
			next();
		};
	}

	unregisterApi(appId: string): void {
		if (this.appRouters.get(appId)) {
			this.appRouters.delete(appId);
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
				user: req.user && this.apps.getConverters()?.get('users')?.convertToApp(req.user),
			};
			this.apps
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
