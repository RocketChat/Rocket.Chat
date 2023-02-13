import express from 'express';
import { WebApp } from 'meteor/webapp';

import { AppsApiService } from '../../../../server/sdk';
import { authenticationMiddleware } from '../../../api/server/middlewares/authentication';

const apiServer = express();

apiServer.disable('x-powered-by');

WebApp.connectHandlers.use(apiServer);

class AppsApiRoutes {
	constructor() {
		const rejectUnauthorized = false;
		apiServer.use('/api/apps/private/:appId/:hash', authenticationMiddleware({ rejectUnauthorized }), AppsApiService.handlePrivateRequest);
		apiServer.use('/api/apps/public/:appId', authenticationMiddleware({ rejectUnauthorized }), AppsApiService.handlePublicRequest);
	}
}

export const AppsApiRoutesInstance = new AppsApiRoutes();
