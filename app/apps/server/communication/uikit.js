import express from 'express';
import rateLimit from 'express-rate-limit';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { UIKitIncomingInteractionType } from '@rocket.chat/apps-engine/definition/uikit';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';

import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { Apps } from '../orchestrator';

const apiServer = express();

apiServer.disable('x-powered-by');

WebApp.connectHandlers.use(apiServer);

// eslint-disable-next-line new-cap
const router = express.Router();

const unauthorized = (res) => res.status(401).send({
	status: 'error',
	message: 'You must be logged in to do this.',
});

Meteor.startup(() => {
	// use specific rate limit of 600 (which is 60 times the default limits) requests per minute (around 10/second)
	const apiLimiter = rateLimit({
		windowMs: settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'),
		max: settings.get('API_Enable_Rate_Limiter_Limit_Calls_Default') * 60,
		skip: () =>
			settings.get('API_Enable_Rate_Limiter') !== true
			|| (process.env.NODE_ENV === 'development' && settings.get('API_Enable_Rate_Limiter_Dev') !== true),
	});
	router.use(apiLimiter);
});

router.use((req, res, next) => {
	const {
		'x-user-id': userId,
		'x-auth-token': authToken,
		'x-visitor-token': visitorToken,
	} = req.headers;

	if (userId && authToken) {
		req.user = Users.findOneByIdAndLoginToken(userId, authToken);
		req.userId = req.user._id;
	}

	if (visitorToken) {
		req.visitor = Apps.getConverters().get('visitors').convertByToken(visitorToken);
	}

	if (!req.user && !req.visitor) {
		return unauthorized(res);
	}

	next();
});

apiServer.use('/api/apps/ui.interaction/', router);

export class AppUIKitInteractionApi {
	constructor(orch) {
		this.orch = orch;

		router.post('/:appId', (req, res) => {
			const {
				appId,
			} = req.params;

			const {
				type,
			} = req.body;

			switch (type) {
				case UIKitIncomingInteractionType.BLOCK: {
					const {
						type,
						actionId,
						triggerId,
						mid,
						rid,
						payload,
						container,
					} = req.body;

					const { visitor } = req;
					const room = this.orch.getConverters().get('rooms').convertById(rid);
					const user = this.orch.getConverters().get('users').convertToApp(req.user);
					const message = mid && this.orch.getConverters().get('messages').convertById(mid);

					const action = {
						type,
						container,
						appId,
						actionId,
						message,
						triggerId,
						payload,
						user,
						visitor,
						room,
					};

					try {
						const eventInterface = !visitor ? AppInterface.IUIKitInteractionHandler : AppInterface.IUIKitLivechatInteractionHandler;

						const result = Promise.await(this.orch.triggerEvent(eventInterface, action));

						res.send(result);
					} catch (e) {
						res.status(500).send(e.message);
					}
					break;
				}

				case UIKitIncomingInteractionType.VIEW_CLOSED: {
					const {
						type,
						actionId,
						payload: {
							view,
							isCleared,
						},
					} = req.body;

					const user = this.orch.getConverters().get('users').convertToApp(req.user);

					const action = {
						type,
						appId,
						actionId,
						user,
						payload: {
							view,
							isCleared,
						},
					};

					try {
						Promise.await(this.orch.triggerEvent('IUIKitInteractionHandler', action));

						res.sendStatus(200);
					} catch (e) {
						console.log(e);
						res.status(500).send(e.message);
					}
					break;
				}

				case UIKitIncomingInteractionType.VIEW_SUBMIT: {
					const {
						type,
						actionId,
						triggerId,
						payload,
					} = req.body;

					const user = this.orch.getConverters().get('users').convertToApp(req.user);

					const action = {
						type,
						appId,
						actionId,
						triggerId,
						payload,
						user,
					};

					try {
						const result = Promise.await(this.orch.triggerEvent('IUIKitInteractionHandler', action));

						res.send(result);
					} catch (e) {
						res.status(500).send(e.message);
					}
					break;
				}
			}

			// TODO: validate payloads per type
		});
	}
}
