import { Analytics } from '@rocket.chat/core-services';
import express from 'express';
import { WebApp } from 'meteor/webapp';

import { authenticationMiddleware, hasPermissionMiddleware } from '../../app/api/server/middlewares/authentication';
import { getSeatsRequestLink } from '../app/license/server/getSeatsRequestLink';

const apiServer = express();

WebApp.connectHandlers.use(apiServer);

// eslint-disable-next-line new-cap
const router = express.Router();

apiServer.use('/requestSeats', router);
apiServer.use('/links/manage-subscription', router);

router.use(authenticationMiddleware({ rejectUnauthorized: true, cookies: true }));

router.use(hasPermissionMiddleware('manage-cloud'));

router.get('/', async (req, res) => {
	const url = await getSeatsRequestLink(req.query as Record<string, string>);

	await Analytics.saveSeatRequest();
	res.writeHead(302, { Location: url });
	res.end();
});
