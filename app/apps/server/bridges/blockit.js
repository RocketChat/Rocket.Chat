import express from 'express';
import { WebApp } from 'meteor/webapp';

import { Users } from '../../../models/server';

const apiServer = express();

apiServer.disable('x-powered-by');

WebApp.connectHandlers.use(apiServer);

// eslint-disable-next-line new-cap
const router = express.Router();

const unauthorized = (res) =>
	res.status(401).send({
		status: 'error',
		message: 'You must be logged in to do this.',
	});

router.use((req, res, next) => {
	const {
		'x-user-id': userId,
		'x-auth-token': authToken,
	} = req.headers;

	if (!userId || !authToken) {
		return unauthorized(res);
	}

	const user = Users.findOneByIdAndLoginToken(userId, authToken);
	if (!user) {
		return unauthorized(res);
	}

	req.user = user;
	req.userId = user._id;

	next();
});

apiServer.use('/api/apps/blockit/', router);

export class AppBlockitBridge {
	constructor(orch) {
		this.orch = orch;

		router.post('/:appId', (req, res) => {
			const {
				appId,
			} = req.params;

			const {
				type,
				actionId,
				triggerId,
				messageId,
				payload,
			} = req.body;

			const action = {
				type,
				appId,
				actionId,
				messageId,
				triggerId,
				payload,
			};

			try {
				const result = Promise.await(this.orch.getBridges().getListenerBridge().blockitEvent('IBlockitActionHandler', action));

				res.send(result);
			} catch (e) {
				res.status(500).send(e.message);
			}
		});
	}
}
