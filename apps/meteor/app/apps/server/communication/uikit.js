import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { UIKitIncomingInteractionType } from '@rocket.chat/apps-engine/definition/uikit';
import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';

import { Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { Apps } from '../orchestrator';
import { UiKitCoreApp } from '../../../../server/sdk';

const apiServer = express();

apiServer.disable('x-powered-by');

let corsEnabled = false;
let allowListOrigins = [];

settings.watch('API_Enable_CORS', (value) => {
	corsEnabled = value;
});

settings.watch('API_CORS_Origin', (value) => {
	allowListOrigins = value
		? value
				.trim()
				.split(',')
				.map((origin) => String(origin).trim().toLocaleLowerCase())
		: [];
});

const corsOptions = {
	origin: (origin, callback) => {
		if (
			!origin ||
			!corsEnabled ||
			allowListOrigins.includes('*') ||
			allowListOrigins.includes(origin) ||
			origin === settings.get('Site_Url')
		) {
			callback(null, true);
		} else {
			callback('Not allowed by CORS', false);
		}
	},
};

WebApp.connectHandlers.use(apiServer);

// eslint-disable-next-line new-cap
const router = express.Router();

const unauthorized = (res) =>
	res.status(401).send({
		status: 'error',
		message: 'You must be logged in to do this.',
	});

Meteor.startup(() => {
	// use specific rate limit of 600 (which is 60 times the default limits) requests per minute (around 10/second)
	const apiLimiter = rateLimit({
		windowMs: settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'),
		max: settings.get('API_Enable_Rate_Limiter_Limit_Calls_Default') * 60,
		skip: () =>
			settings.get('API_Enable_Rate_Limiter') !== true ||
			(process.env.NODE_ENV === 'development' && settings.get('API_Enable_Rate_Limiter_Dev') !== true),
	});
	router.use(apiLimiter);
});

router.use((req, res, next) => {
	const { 'x-user-id': userId, 'x-auth-token': authToken, 'x-visitor-token': visitorToken } = req.headers;

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

apiServer.use('/api/apps/ui.interaction/', cors(corsOptions), router);

const getPayloadForType = (type, req) => {
	if (type === UIKitIncomingInteractionType.BLOCK) {
		const { type, actionId, triggerId, mid, rid, payload, container } = req.body;

		const { visitor, user } = req;
		const room = rid; // orch.getConverters().get('rooms').convertById(rid);
		const message = mid;

		return {
			type,
			container,
			actionId,
			message,
			triggerId,
			payload,
			user,
			visitor,
			room,
		};
	}

	if (type === UIKitIncomingInteractionType.VIEW_CLOSED) {
		const {
			type,
			actionId,
			payload: { view, isCleared },
		} = req.body;

		const { user } = req;

		return {
			type,
			actionId,
			user,
			payload: {
				view,
				isCleared,
			},
		};
	}

	if (type === UIKitIncomingInteractionType.VIEW_SUBMIT) {
		const { type, actionId, triggerId, payload } = req.body;

		const { user } = req;

		return {
			type,
			actionId,
			triggerId,
			payload,
			user,
		};
	}

	throw new Error('Type not supported');
};

router.post('/:appId', async (req, res, next) => {
	const { appId } = req.params;

	const isCore = await UiKitCoreApp.isRegistered(appId);
	if (!isCore) {
		return next();
	}

	const { type } = req.body;

	try {
		const payload = {
			...getPayloadForType(type, req),
			appId,
		};

		const result = await UiKitCoreApp[type](payload);

		res.send(result);
	} catch (e) {
		console.error('ops', e);
		res.status(500).send({ error: e.message });
	}
});

const appsRoutes = (orch) => (req, res) => {
	const { appId } = req.params;

	const { type } = req.body;

	switch (type) {
		case UIKitIncomingInteractionType.BLOCK: {
			const { type, actionId, triggerId, mid, rid, payload, container } = req.body;

			const { visitor } = req;
			const room = orch.getConverters().get('rooms').convertById(rid);
			const user = orch.getConverters().get('users').convertToApp(req.user);
			const message = mid && orch.getConverters().get('messages').convertById(mid);

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

				const result = Promise.await(orch.triggerEvent(eventInterface, action));

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
				payload: { view, isCleared },
			} = req.body;

			const user = orch.getConverters().get('users').convertToApp(req.user);

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
				Promise.await(orch.triggerEvent('IUIKitInteractionHandler', action));

				res.sendStatus(200);
			} catch (e) {
				res.status(500).send(e.message);
			}
			break;
		}

		case UIKitIncomingInteractionType.VIEW_SUBMIT: {
			const { type, actionId, triggerId, payload } = req.body;

			const user = orch.getConverters().get('users').convertToApp(req.user);

			const action = {
				type,
				appId,
				actionId,
				triggerId,
				payload,
				user,
			};

			try {
				const result = Promise.await(orch.triggerEvent('IUIKitInteractionHandler', action));

				res.send(result);
			} catch (e) {
				res.status(500).send(e.message);
			}
			break;
		}

		case UIKitIncomingInteractionType.ACTION_BUTTON: {
			const {
				type,
				actionId,
				triggerId,
				rid,
				mid,
				payload: { context },
			} = req.body;

			const room = orch.getConverters().get('rooms').convertById(rid);
			const user = orch.getConverters().get('users').convertToApp(req.user);
			const message = mid && orch.getConverters().get('messages').convertById(mid);

			const action = {
				type,
				appId,
				actionId,
				triggerId,
				user,
				room,
				message,
				payload: {
					context,
				},
			};

			try {
				const result = Promise.await(orch.triggerEvent('IUIKitInteractionHandler', action));

				res.send(result);
			} catch (e) {
				res.status(500).send(e.message);
			}
			break;
		}

		default: {
			res.status(400).send({ error: 'Unknown action' });
		}
	}

	// TODO: validate payloads per type
};

export class AppUIKitInteractionApi {
	constructor(orch) {
		this.orch = orch;

		router.post('/:appId', appsRoutes(orch));
	}
}
