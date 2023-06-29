import type { Request, Response } from 'express';
import express from 'express';
import { WebApp } from 'meteor/webapp';
import { AppsApiService } from '@rocket.chat/core-services';

import { authenticationMiddleware } from '../../../api/server/middlewares/authentication';

const apiServer = express();

apiServer.disable('x-powered-by');

WebApp.connectHandlers.use(apiServer);

class AppsApiRoutes {
	constructor() {
		const rejectUnauthorized = false;
		apiServer.use('/api/apps/private/:appId/:hash', authenticationMiddleware({ rejectUnauthorized }), (req, res) =>
			this._handleRequest(req, res, AppsApiService.handlePrivateRequest),
		);
		apiServer.use('/api/apps/public/:appId', authenticationMiddleware({ rejectUnauthorized }), (req, res) =>
			this._handleRequest(req, res, AppsApiService.handlePublicRequest),
		);
	}

	async _handleRequest(req: Request, res: Response, requestHandler: any) {
		const { statusCode, headers, body } = await requestHandler(req, res);

		res.set(headers);
		res.status(statusCode);
		res.send(body);
	}
}

export const AppsApiRoutesInstance = new AppsApiRoutes();
