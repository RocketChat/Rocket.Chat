import { AppEvents, type IAppServerOrchestrator } from '@rocket.chat/apps';
import { UiKitCoreApp } from '@rocket.chat/core-services';
import { nodeHandler } from '@rocket.chat/http-router';
import { Logger } from '@rocket.chat/logger';
import type { OperationParams, OperationResult, UrlParams } from '@rocket.chat/rest-typings';
import bodyParser from 'body-parser';
import cors from 'cors';
import type { Request, Response } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';

import { authenticationMiddleware } from '../../../../server/api/v1/middlewares/authentication';
import { nodeLoggerMiddleware } from '../../../../server/api/v1/middlewares/logger';
import { httpApp } from '../../../../server/lib/http/httpServer';
import { confirmViewFiles } from '../../../../server/lib/uikit/confirmViewFiles';
import { viewSubmitAnswer, withDefaultCloseTarget } from '../../../../server/lib/uikit/interactionResponses';
import { recordInteractionView, withRecordedView } from '../../../../server/lib/uikit/recordedViews';
import { reportInvalidInteractionBlocks } from '../../../../server/lib/uikit/reportInvalidBlocks';
import { settings } from '../../../../server/settings';
import { Apps } from '../../lib/apps/orchestrator';

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

const logger = new Logger('APPS');

httpApp.use('/api/apps/ui.interaction/*', nodeHandler(nodeLoggerMiddleware(logger)), nodeHandler(apiServer));

// oxlint-disable-next-line new-cap
const router = express.Router();

const unauthorized = (res: Response): unknown =>
	res.status(401).send({
		status: 'error',
		message: 'You must be logged in to do this.',
	});

export const addUiKitRateLimiter = (): void => {
	// use specific rate limit of 600 (which is 60 times the default limits) requests per minute (around 10/second)
	const apiLimiter = rateLimit({
		windowMs: settings.get('API_Enable_Rate_Limiter_Limit_Time_Default'),
		max: settings.get<number>('API_Enable_Rate_Limiter_Limit_Calls_Default') * 60,
		skip: () =>
			settings.get('API_Enable_Rate_Limiter') !== true ||
			(process.env.NODE_ENV === 'development' && settings.get('API_Enable_Rate_Limiter_Dev') !== true),
	});

	router.use(apiLimiter);
};

router.use(authenticationMiddleware({ rejectUnauthorized: false }));

router.use(async (req: Request, res, next) => {
	const { 'x-visitor-token': visitorToken } = req.headers;

	// The visitor comes only from the token header, never from the request body.
	req.body.visitor =
		visitorToken && typeof visitorToken === 'string' ? await Apps.getConverters()?.get('visitors').convertByToken(visitorToken) : undefined;

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
	OperationResult<'POST', '/apps/ui.interaction/:id'> | { error: unknown },
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

router.post('/:id', async (req: UiKitUserInteractionRequest, res, next) => {
	const { id: appId } = req.params;

	const isCoreApp = await UiKitCoreApp.isRegistered(appId);
	if (!isCoreApp) {
		return next();
	}

	try {
		const { user } = req;

		switch (req.body.type) {
			case 'blockAction': {
				const { type, actionId, triggerId, payload, container, visitor } = req.body;
				const message = 'mid' in req.body ? req.body.mid : undefined;
				const room = 'rid' in req.body ? req.body.rid : undefined;

				const result = await UiKitCoreApp.blockAction({
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
				});

				// Using ?? to always send something in the response, even if the app had no result.
				res.send(result ?? {});

				return;
			}

			case 'viewSubmit': {
				const { type, actionId, triggerId, payload } = req.body;

				const result = await UiKitCoreApp.viewSubmit({
					appId,
					type,
					actionId,
					triggerId,
					payload,
					user,
				});

				// Using ?? to always send something in the response, even if the app had no result.
				res.send(result ?? {});

				return;
			}

			case 'viewClosed': {
				const {
					type,
					payload: { view, isCleared },
					triggerId,
				} = req.body;

				const result = await UiKitCoreApp.viewClosed({
					appId,
					triggerId,
					type,
					user,
					payload: {
						view,
						isCleared,
					},
				});

				// Using ?? to always send something in the response, even if the app had no result.
				res.send(result ?? {});

				return;
			}

			default:
				throw new Error('Type not supported');
		}
	} catch (e) {
		const error = e instanceof Error ? e.message : e;
		res.status(500).send({ error });
	}
});

export class AppUIKitInteractionApi {
	orch: IAppServerOrchestrator;

	constructor(orch: IAppServerOrchestrator) {
		this.orch = orch;

		router.post('/:id', this.routeHandler.bind(this));
	}

	private async handleBlockAction(
		appId: string,
		body: Extract<UiKitUserInteractionRequest['body'], { type: 'blockAction' }>,
		reqUser: UiKitUserInteractionRequest['user'],
		res: Response<OperationResult<'POST', '/apps/ui.interaction/:id'> | { error: unknown }>,
	): Promise<void> {
		const { orch } = this;

		const { type, actionId, triggerId, payload, container, rid } = body;
		const mid = 'mid' in body ? body.mid : undefined;

		const { visitor } = body;
		const user = orch.getConverters()?.get('users').convertToApp(reqUser);
		const message = mid ? await orch.getConverters()?.get('messages').convertById(mid) : undefined;
		const room = rid ? await orch.getConverters()?.get('rooms').convertById(rid) : undefined;

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
			const eventInterface = !visitor ? AppEvents.IUIKitInteractionHandler : AppEvents.IUIKitLivechatInteractionHandler;

			const result = await orch.triggerEvent(eventInterface, action);

			if (reportInvalidInteractionBlocks(result, { where: 'ui.interaction', appId, userId: reqUser?._id })) {
				res.send({});
				return;
			}

			await withDefaultCloseTarget(result, container, appId, reqUser?._id);
			const delivered = await recordInteractionView(result, appId, reqUser?._id);
			res.send(delivered ? result : {});
		} catch (e) {
			const error = e instanceof Error ? e.message : e;
			res.status(500).send({ error });
		}
	}

	private async handleBlockSuggestion(
		appId: string,
		body: Extract<UiKitUserInteractionRequest['body'], { type: 'blockSuggestion' }>,
		reqUser: UiKitUserInteractionRequest['user'],
		res: Response<OperationResult<'POST', '/apps/ui.interaction/:id'> | { error: unknown }>,
	): Promise<void> {
		const { orch } = this;

		const { type, actionId, blockId, value, container, triggerId, rid } = body;
		const mid = 'mid' in body ? body.mid : undefined;

		const user = orch.getConverters()?.get('users').convertToApp(reqUser);
		const message = mid ? await orch.getConverters()?.get('messages').convertById(mid) : undefined;
		const room = rid ? await orch.getConverters()?.get('rooms').convertById(rid) : undefined;

		const action = { type, appId, actionId, blockId, value, container, triggerId, user, message, room };

		try {
			const result = await orch.triggerEvent(AppEvents.IUIKitInteractionHandler, action);

			res.send(result);
		} catch (e) {
			const error = e instanceof Error ? e.message : e;
			res.status(500).send({ error });
		}
	}

	private async handleViewClosed(
		appId: string,
		body: Extract<UiKitUserInteractionRequest['body'], { type: 'viewClosed' }>,
		reqUser: UiKitUserInteractionRequest['user'],
		res: Response<OperationResult<'POST', '/apps/ui.interaction/:id'> | { error: unknown }>,
	): Promise<void> {
		const { orch } = this;

		const {
			type,
			rid,
			triggerId,
			payload: { view, isCleared },
		} = body;

		const user = orch.getConverters()?.get('users').convertToApp(reqUser);
		const room = rid ? await orch.getConverters()?.get('rooms').convertById(rid) : undefined;

		const recordedView = await withRecordedView(view, appId, reqUser?._id);
		if (!recordedView) {
			// A view the server no longer has still closes for the user.
			res.send({});
			return;
		}

		const { visitor } = body;
		const action = {
			type,
			appId,
			triggerId,
			user,
			visitor,
			room,
			payload: {
				view: recordedView,
				isCleared,
			},
		};

		try {
			const result = await orch.triggerEvent(
				!visitor ? AppEvents.IUIKitInteractionHandler : AppEvents.IUIKitLivechatInteractionHandler,
				action,
			);

			if (reportInvalidInteractionBlocks(result, { where: 'ui.interaction', appId, userId: reqUser?._id })) {
				res.send({});
				return;
			}

			const delivered = await recordInteractionView(result, appId, reqUser?._id);
			res.send(delivered ? result : {});
		} catch (e) {
			const error = e instanceof Error ? e.message : e;
			res.status(500).send({ error });
		}
	}

	private async handleViewSubmit(
		appId: string,
		body: Extract<UiKitUserInteractionRequest['body'], { type: 'viewSubmit' }>,
		reqUser: UiKitUserInteractionRequest['user'],
		res: Response<OperationResult<'POST', '/apps/ui.interaction/:id'> | { error: unknown }>,
	): Promise<void> {
		const { orch } = this;

		const { type, actionId, triggerId, payload, rid } = body;

		const user = orch.getConverters()?.get('users').convertToApp(reqUser);
		const room = rid ? await orch.getConverters()?.get('rooms').convertById(rid) : undefined;

		const view = await withRecordedView(payload.view, appId, reqUser?._id);
		if (!view) {
			res.status(400).send({ error: 'The view is no longer available' });
			return;
		}

		const { visitor } = body;
		const action = {
			type,
			appId,
			actionId,
			triggerId,
			payload: { ...payload, view },
			user,
			visitor,
			room,
		};

		try {
			await confirmViewFiles(view, reqUser?._id);
			const result = await orch.triggerEvent(
				!visitor ? AppEvents.IUIKitInteractionHandler : AppEvents.IUIKitLivechatInteractionHandler,
				action,
			);

			if (reportInvalidInteractionBlocks(result, { where: 'ui.interaction', appId, userId: reqUser?._id })) {
				res.send({});
				return;
			}

			if (typeof view.id === 'string') {
				await withDefaultCloseTarget(result, { type: 'view', id: view.id }, appId, reqUser?._id);
			}
			const delivered = await recordInteractionView(result, appId, reqUser?._id);
			const answer = viewSubmitAnswer(delivered, result);
			res.status(answer.status).send(answer.body);
		} catch (e) {
			const error = e instanceof Error ? e.message : e;
			res.status(500).send({ error });
		}
	}

	private async handleActionButton(
		appId: string,
		body: Extract<UiKitUserInteractionRequest['body'], { type: 'actionButton' }>,
		reqUser: UiKitUserInteractionRequest['user'],
		res: Response<OperationResult<'POST', '/apps/ui.interaction/:id'> | { error: unknown }>,
	): Promise<void> {
		const { orch } = this;

		const {
			type,
			actionId,
			triggerId,
			rid,
			mid,
			tmid,
			payload: { context, message: msgText },
		} = body;

		const user = orch.getConverters()?.get('users').convertToApp(reqUser);
		const room = rid ? await orch.getConverters()?.get('rooms').convertById(rid) : undefined;
		const message = mid ? await orch.getConverters()?.get('messages').convertById(mid) : undefined;

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
			const result = await orch.triggerEvent(AppEvents.IUIKitInteractionHandler, action);

			if (reportInvalidInteractionBlocks(result, { where: 'ui.interaction', appId, userId: reqUser?._id })) {
				res.send({});
				return;
			}

			const delivered = await recordInteractionView(result, appId, reqUser?._id);
			res.send(delivered ? result : {});
		} catch (e) {
			const error = e instanceof Error ? e.message : e;
			res.status(500).send({ error });
		}
	}

	private async routeHandler(
		req: UiKitUserInteractionRequest,
		res: Response<OperationResult<'POST', '/apps/ui.interaction/:id'> | { error: unknown }>,
	): Promise<void> {
		const { id: appId } = req.params;

		switch (req.body.type) {
			case 'blockAction': {
				await this.handleBlockAction(appId, req.body, req.user, res);
				break;
			}

			case 'blockSuggestion': {
				await this.handleBlockSuggestion(appId, req.body, req.user, res);
				break;
			}

			case 'viewClosed': {
				await this.handleViewClosed(appId, req.body, req.user, res);
				break;
			}

			case 'viewSubmit': {
				await this.handleViewSubmit(appId, req.body, req.user, res);
				break;
			}

			case 'actionButton': {
				await this.handleActionButton(appId, req.body, req.user, res);
				break;
			}

			default: {
				res.status(400).send({ error: 'Unknown action' });
			}
		}

		// TODO: validate payloads per type
	}
}
