import type { IApi, IApiEndpoint } from '@rocket.chat/apps-engine/definition/api';
import { ApiBridge } from '@rocket.chat/apps-engine/server/bridges';
import type { AppApi } from '@rocket.chat/apps-engine/server/managers/AppApi';
import { AppsApiService } from '@rocket.chat/core-services';
import express from 'express';
import type { Response, Request, IRouter } from 'express';
import { WebApp } from 'meteor/webapp';

import type { AppServerOrchestrator } from '../../../../ee/server/apps/orchestrator';

const apiServer = express();

apiServer.disable('x-powered-by');

WebApp.connectHandlers.use(apiServer);

interface IRequestWithPrivateHash extends Request {
	_privateHash?: string;
	content?: any;
}

export class AppApisBridge extends ApiBridge {
	appRouters: Map<string, IRouter>;

	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
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

	protected async registerApi({ api, computedPath, endpoint }: AppApi, appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is registering the api: "${endpoint.path}" (${computedPath})`);

		this._verifyApi(api, endpoint);

		await AppsApiService.registerApi(endpoint, appId);
	}

	protected async unregisterApis(appId: string): Promise<void> {
		this.orch.debugLog(`The App ${appId} is unregistering all apis`);

		await AppsApiService.unregisterApi(appId);
	}

	private _verifyApi(api: IApi, endpoint: IApiEndpoint): void {
		if (typeof api !== 'object') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}

		if (typeof endpoint.path !== 'string') {
			throw new Error('Invalid Api parameter provided, it must be a valid IApi object.');
		}
	}
}
