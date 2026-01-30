import { Analytics } from '@rocket.chat/core-services';
import express, { type Request } from 'express';
import { WebApp } from 'meteor/webapp';

import { authenticationMiddleware, hasPermissionMiddleware } from '../../app/api/server/middlewares/authentication';
import { getCheckoutUrl, fallback } from '../../app/cloud/server/functions/getCheckoutUrl';
import { getSeatsRequestLink } from '../app/license/server/getSeatsRequestLink';

const apiServer = express();

WebApp.connectHandlers.use(apiServer);

// eslint-disable-next-line new-cap
const router = express.Router();

apiServer.use('/requestSeats', router);
apiServer.use('/links/manage-subscription', router);

router.use(authenticationMiddleware({ rejectUnauthorized: false, cookies: true }));

router.use(
	hasPermissionMiddleware('manage-cloud', {
		rejectUnauthorized: false,
	}),
);

router.get('/', async (req: Request, res) => {
	const url = await getSeatsRequestLink(req.unauthorized ? fallback : (await getCheckoutUrl()).url, req.query as Record<string, string>);

	await Analytics.saveSeatRequest();

	res.writeHead(302, { Location: url });
	res.end();
});
