import type { UiKitCoreAppPayload } from '@rocket.chat/core-services';
import { UiKitCoreApp } from '@rocket.chat/core-services';
import type { OperationParams, UrlParams } from '@rocket.chat/rest-typings';
import bodyParser from 'body-parser';
import cors from 'cors';
import type { Request, Response } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

import { authenticationMiddleware } from '../../../../app/api/server/middlewares/authentication';
import { settings } from '../../../../app/settings/server';
import type { AppServerOrchestrator } from '../orchestrator';
import { Apps } from '../orchestrator';

const apiServer = express();

apiServer.disable('x-powered-by');

let corsEnabled = false;
let allowListOrigins: string[] = [];

settings.watch('API_Enable_CORS', (value: boolean) => {
	corsEnabled = value;
});

settings.watch('API_CORS_Origin', (value: string) => {
	allowListOrigins = value
		? value
				.trim()
				.split(',')
				.map((origin) => String(origin).trim().toLocaleLowerCase())
		: [];
});

WebApp.rawConnectHandlers.use(apiServer);

// eslint-disable-next-line new-cap
const router = express.Router();

const unauthorized = (res: Response): unknown =>
	res.status(401).send({
		status: 'error',
		message: 'You must be logged in to do this.',
	});

Meteor.startup(() => {
	// use specific rate limit of 600 (which is 60 times the default limits) requests per minute (around 10/second)
	const apiLimiter = rateLimit({
		windowMs: settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'),
		max: (settings.get('API_Enable_Rate_Limiter_Limit_Calls_Default') as number) * 60,
		skip: () =>
			settings.get('API_Enable_Rate_Limiter') !== true ||
			(process.env.NODE_ENV === 'development' && settings.get('API_Enable_Rate_Limiter_Dev') !== true),
	});

	router.use(apiLimiter);
});

router.use(authenticationMiddleware({ rejectUnauthorized: false }));

router.use(async (req: Request, res, next) => {
	const { 'x-visitor-token': visitorToken } = req.headers;

	if (visitorToken) {
		req.body.visitor = await Apps.getConverters()?.get('visitors').convertByToken(visitorToken);
	}

	if (!req.user && !req.body.visitor) {
		return unauthorized(res);
	}

	next();
});

const corsOptions: cors.CorsOptions = {
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
			callback(new Error('Not allowed by CORS'), false);
		}
	},
};

apiServer.use('/api/apps/ui.interaction/', bodyParser.json(), cors(corsOptions), router); // didn't have the rateLimiter option

type UiKitUserInteractionRequest = Request<
	UrlParams<'/apps/ui.interaction/:id'>,
	any,
	OperationParams<'POST', '/apps/ui.interaction/:id'> & {
		visitor?: {
			id: string;
			username: string;
			name?: string;
			department?: string;
			updatedAt?: Date;
			token: string;
			phone?: { phoneNumber: string }[] | null;
			visitorEmails?: { address: string }[];
			livechatData?: Record<string, unknown>;
			status?: 'online' | 'away' | 'offline' | 'busy' | 'disabled';
		};
	}
>;

const getCoreAppPayload = (req: UiKitUserInteractionRequest): UiKitCoreAppPayload => {
	const { id: appId } = req.params;

	if (req.body.type === 'blockAction') {
		const { user } = req;
		const { type, actionId, triggerId, payload, container, visitor } = req.body;
		const message = 'mid' in req.body ? req.body.mid : undefined;
		const room = 'rid' in req.body ? req.body.rid : undefined;

		return {
			appId,
			type,
			actionId,
			triggerId,
			container,
			message,
			payload,
			user,
			visitor,
			room,
		};
	}

	if (req.body.type === 'viewClosed') {
		const { user } = req;
		const {
			type,
			payload: { view, isCleared },
			triggerId,
		} = req.body;

		return {
			appId,
			triggerId,
			type,
			user,
			payload: {
				view,
				isCleared,
			},
		};
	}

	if (req.body.type === 'viewSubmit') {
		const { user } = req;
		const { type, actionId, triggerId, payload } = req.body;

		return {
			appId,
			type,
			actionId,
			triggerId,
			payload,
			user,
		};
	}

	throw new Error('Type not supported');
};

router.post('/:id', async (req: UiKitUserInteractionRequest, res, next) => {
	const { id: appId } = req.params;

	const isCoreApp = await UiKitCoreApp.isRegistered(appId);
	if (!isCoreApp) {
		return next();
	}

	try {
		const payload = getCoreAppPayload(req);

		const result = await UiKitCoreApp[payload.type](payload);

		// Using ?? to always send something in the response, even if the app had no result.
		res.send(result ?? {});
	} catch (e) {
		const error = e instanceof Error ? e.message : e;
		res.status(500).send({ error });
	}
});

export class AppUIKitInteractionApi {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;

		router.post('/:id', this.routeHandler);
	}

	private routeHandler = async (req: UiKitUserInteractionRequest, res: Response): Promise<void> => {
		const { orch } = this;
		const { id: appId } = req.params;

		switch (req.body.type) {
			case 'blockAction': {
				const { type, actionId, triggerId, payload, container } = req.body;
				const mid = 'mid' in req.body ? req.body.mid : undefined;
				const rid = 'rid' in req.body ? req.body.rid : undefined;

				const { visitor } = req.body;
				const room = await orch.getConverters()?.get('rooms').convertById(rid);
				const user = orch.getConverters()?.get('users').convertToApp(req.user);
				const message = mid && (await orch.getConverters()?.get('messages').convertById(mid));

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
					const eventInterface = !visitor ? 'IUIKitInteractionHandler' : 'IUIKitLivechatInteractionHandler';

					const result = await orch.triggerEvent(eventInterface, action);

					res.send(result);
				} catch (e) {
					const error = e instanceof Error ? e.message : e;
					res.status(500).send({ error });
				}
				break;
			}

			case 'viewClosed': {
				const {
					type,
					payload: { view, isCleared },
				} = req.body;

				const user = orch.getConverters()?.get('users').convertToApp(req.user);

				const action = {
					type,
					appId,
					user,
					payload: {
						view,
						isCleared,
					},
				};

				try {
					const result = await orch.triggerEvent('IUIKitInteractionHandler', action);

					res.send(result);
				} catch (e) {
					const error = e instanceof Error ? e.message : e;
					res.status(500).send({ error });
				}
				break;
			}

			case 'viewSubmit': {
				const { type, actionId, triggerId, payload } = req.body;

				const user = orch.getConverters()?.get('users').convertToApp(req.user);

				const action = {
					type,
					appId,
					actionId,
					triggerId,
					payload,
					user,
				};

				try {
					const result = await orch.triggerEvent('IUIKitInteractionHandler', action);

					res.send(result);
				} catch (e) {
					const error = e instanceof Error ? e.message : e;
					res.status(500).send({ error });
				}
				break;
			}

			case 'actionButton': {
				const {
					type,
					actionId,
					triggerId,
					rid,
					mid,
					tmid,
					payload: { context, message: msgText },
				} = req.body;

				const room = await orch.getConverters()?.get('rooms').convertById(rid);
				const user = orch.getConverters()?.get('users').convertToApp(req.user);
				const message = mid && (await orch.getConverters()?.get('messages').convertById(mid));

				const action = {
					type,
					appId,
					actionId,
					triggerId,
					user,
					room,
					message,
					tmid,
					payload: {
						context,
						...(msgText ? { message: msgText } : {}),
					},
				};

				try {
					const result = await orch.triggerEvent('IUIKitInteractionHandler', action);

					res.send(result);
				} catch (e) {
					const error = e instanceof Error ? e.message : e;
					res.status(500).send({ error });
				}
				break;
			}

			default: {
				res.status(400).send({ error: 'Unknown action' });
			}
		}

		// TODO: validate payloads per type
	};
}
