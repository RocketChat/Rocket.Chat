import type { IIncomingIntegration, IIntegration, IOutgoingIntegration, IUser, RequiredField } from '@rocket.chat/core-typings';
import { Integrations, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { isIntegrationsHooksAddSchema, isIntegrationsHooksRemoveSchema } from '@rocket.chat/rest-typings';
import type express from 'express';
import type { Context, Next } from 'hono';
import { Meteor } from 'meteor/meteor';
import type { RateLimiterOptionsToCheck } from 'meteor/rate-limit';
import { WebApp } from 'meteor/webapp';
import _ from 'underscore';

import { isPlainObject } from '../../../../lib/utils/isPlainObject';
import { APIClass } from '../../../api/server/ApiClass';
import type { RateLimiterOptions } from '../../../api/server/api';
import { API, defaultRateLimiterOptions } from '../../../api/server/api';
import type { FailureResult, GenericRouteExecutionContext, SuccessResult, UnavailableResult } from '../../../api/server/definition';
import { loggerMiddleware } from '../../../api/server/middlewares/logger';
import { metricsMiddleware } from '../../../api/server/middlewares/metrics';
import { tracerSpanMiddleware } from '../../../api/server/middlewares/tracer';
import type { WebhookResponseItem } from '../../../lib/server/functions/processWebhookMessage';
import { processWebhookMessage } from '../../../lib/server/functions/processWebhookMessage';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';
import { IsolatedVMScriptEngine } from '../lib/isolated-vm/isolated-vm';
import { incomingLogger, integrationLogger } from '../logger';
import { addOutgoingIntegration } from '../methods/outgoing/addOutgoingIntegration';
import { deleteOutgoingIntegration } from '../methods/outgoing/deleteOutgoingIntegration';

const ivmEngine = new IsolatedVMScriptEngine(true);

// eslint-disable-next-line no-unused-vars
function getEngine(_integration: IIntegration): IsolatedVMScriptEngine<true> {
	return ivmEngine;
}

type IntegrationOptions = {
	event: string;
	name: string;
	target_url: string;
	data?: {
		channel_name?: string;
		trigger_words?: string[];
		username?: string;
	};
};

type IntegrationThis = GenericRouteExecutionContext & {
	request: Request & {
		integration: IIncomingIntegration;
	};
	user: IUser & { username: RequiredField<IUser, 'username'> };
};

async function createIntegration(options: IntegrationOptions, user: IUser): Promise<IOutgoingIntegration | undefined> {
	incomingLogger.info({ msg: 'Add integration', integration: options.name });
	incomingLogger.debug({ options });

	switch (options.event) {
		case 'newMessageOnChannel':
			if (options.data == null) {
				options.data = {};
			}
			if (options.data.channel_name != null && options.data.channel_name.indexOf('#') === -1) {
				options.data.channel_name = `#${options.data.channel_name}`;
			}
			return addOutgoingIntegration(user._id, {
				username: 'rocket.cat',
				urls: [options.target_url],
				name: options.name,
				channel: options.data.channel_name,
				triggerWords: options.data.trigger_words,
				type: 'webhook-outgoing',
				event: 'sendMessage',
				token: Random.id(24),
				scriptEnabled: false,
				script: '',
				enabled: true,
				_id: Random.id(),
				_updatedAt: new Date(),
			});
		case 'newMessageToUser':
			if (options.data?.username?.indexOf('@') === -1) {
				options.data.username = `@${options.data.username}`;
			}
			if (!options.data?.username) {
				throw new Error('username-required');
			}

			return addOutgoingIntegration(user._id, {
				username: 'rocket.cat',
				urls: [options.target_url],
				name: options.name,
				channel: options.data.username,
				triggerWords: options.data.trigger_words,
				_id: '',
				type: 'webhook-outgoing',
				token: '',
				scriptEnabled: false,
				script: '',
				enabled: false,
				_updatedAt: new Date(),
				event: 'sendMessage',
			});
	}
}

async function removeIntegration(options: { target_url: string }, user: IUser): Promise<SuccessResult<void> | FailureResult<string>> {
	incomingLogger.info('Remove integration');
	incomingLogger.debug({ options });

	const integrationToRemove = await Integrations.findOneByUrl(options.target_url);
	if (!integrationToRemove) {
		return API.v1.failure('integration-not-found');
	}

	await deleteOutgoingIntegration(integrationToRemove._id, user._id);

	return API.v1.success();
}

async function executeIntegrationRest(
	this: IntegrationThis,
): Promise<
	| SuccessResult<Record<string, string> | { responses: WebhookResponseItem[] } | undefined | void>
	| FailureResult<string>
	| FailureResult<{ responses: WebhookResponseItem[] }>
	| UnavailableResult<string>
> {
	incomingLogger.info({ msg: 'Post integration:', integration: this.request.integration.name });
	incomingLogger.debug({ urlParams: this.urlParams, bodyParams: this.bodyParams });

	if (this.request.integration.enabled !== true) {
		return API.v1.unavailable('Service Unavailable');
	}

	const defaultValues = {
		channel: this.request.integration.channel,
		alias: this.request.integration.alias || '',
		avatar: this.request.integration.avatar || '',
		emoji: this.request.integration.emoji || '',
	};

	const scriptEngine = getEngine(this.request.integration);

	let bodyParams = isPlainObject(this.bodyParams) ? this.bodyParams : {};
	const separateResponse = bodyParams.separateResponse === true;
	let scriptResponse: Record<string, any> | undefined;

	if (scriptEngine.integrationHasValidScript(this.request.integration) && this.request.body) {
		const buffers = [];
		const reader = this.request.body.getReader();
		// eslint-disable-next-line no-await-in-loop
		for (let result = await reader.read(); !result.done; result = await reader.read()) {
			buffers.push(result.value);
		}
		const contentRaw = Buffer.concat(buffers).toString('utf8');
		const protocol = `${this.request.headers.get('x-forwarded-proto')}:` || 'http:';
		const url = new URL(this.request.url, `${protocol}//${this.request.headers.get('host')}`);
		const query = isPlainObject(this.queryParams) ? this.queryParams : {};

		const request = {
			url: {
				query,
				hash: url.hash,
				search: url.search,
				pathname: url.pathname,
				path: this.request.url,
			},
			url_raw: this.request.url,
			url_params: this.urlParams,
			content: bodyParams,
			content_raw: contentRaw,
			headers: Object.fromEntries(this.request.headers.entries()),
			body: bodyParams,
			user: {
				_id: this.user._id,
				name: this.user.name || '',
				username: this.user.username,
			},
		};

		const result = await scriptEngine.processIncomingRequest({
			integration: this.request.integration,
			request,
		});

		try {
			if (!result) {
				incomingLogger.debug({
					msg: 'Process Incoming Request result of Trigger has no data',
					integration: this.request.integration.name,
				});
				return API.v1.success();
			}
			if (result?.error) {
				return API.v1.failure(result.error);
			}

			bodyParams = result?.content;

			if (!('separateResponse' in bodyParams)) {
				bodyParams.separateResponse = separateResponse;
			}

			scriptResponse = result.response;
			if (result.user) {
				this.user = result.user;
			}

			incomingLogger.debug({
				msg: 'Process Incoming Request result of Trigger',
				integration: this.request.integration.name,
				result: bodyParams,
			});
		} catch (err) {
			incomingLogger.error({
				msg: 'Error running Script in Trigger',
				integration: this.request.integration.name,
				script: this.request.integration.scriptCompiled,
				err,
			});
			return API.v1.failure('error-running-script');
		}
	}

	if (!bodyParams || (_.isEmpty(bodyParams) && !this.request.integration.scriptEnabled)) {
		return API.v1.success();
	}

	if ((bodyParams.channel || bodyParams.roomId) && !this.request.integration.overrideDestinationChannelEnabled) {
		return API.v1.failure('overriding destination channel is disabled for this integration');
	}

	bodyParams.bot = { i: this.request.integration._id };

	try {
		const messageResponse = await processWebhookMessage(bodyParams, this.user, defaultValues);
		if (_.isEmpty(messageResponse)) {
			return API.v1.failure('unknown-error');
		}

		if (scriptResponse) {
			incomingLogger.debug({ msg: 'response', response: scriptResponse });
			return API.v1.success(scriptResponse);
		}
		if (bodyParams.separateResponse) {
			const allFailed = messageResponse.every((response) => 'error' in response && response.error);
			if (allFailed) {
				return API.v1.failure({ responses: messageResponse });
			}
			return API.v1.success({ responses: messageResponse });
		}
		return API.v1.success();
	} catch (err: any) {
		incomingLogger.error({ msg: 'Error processing webhook message', err });
		return API.v1.failure(err?.error || err?.message || 'Unknown error');
	}
}

type IntegrationSampleBody = {
	token: string;
	channel_id: string;
	channel_name: string;
	timestamp: Date;
	user_id: string;
	user_name: string;
	text: string;
	trigger_word: string;
};

function integrationSampleRest(): { statusCode: number; body: IntegrationSampleBody[] } {
	incomingLogger.info('Sample Integration');
	return {
		statusCode: 200,
		body: [
			{
				token: Random.id(24),
				channel_id: Random.id(),
				channel_name: 'general',
				timestamp: new Date(),
				user_id: Random.id(),
				user_name: 'rocket.cat',
				text: 'Sample text 1',
				trigger_word: 'Sample',
			},
			{
				token: Random.id(24),
				channel_id: Random.id(),
				channel_name: 'general',
				timestamp: new Date(),
				user_id: Random.id(),
				user_name: 'rocket.cat',
				text: 'Sample text 2',
				trigger_word: 'Sample',
			},
			{
				token: Random.id(24),
				channel_id: Random.id(),
				channel_name: 'general',
				timestamp: new Date(),
				user_id: Random.id(),
				user_name: 'rocket.cat',
				text: 'Sample text 3',
				trigger_word: 'Sample',
			},
		],
	};
}

function integrationInfoRest(): { statusCode: number; body: { success: boolean } } {
	incomingLogger.info('Info integration');
	return {
		statusCode: 200,
		body: {
			success: true,
		},
	};
}

class WebHookAPI extends APIClass<'/hooks'> {
	override async authenticatedRoute(routeContext: IntegrationThis): Promise<IUser | null> {
		const { integrationId, token } = routeContext.urlParams;
		const integration = await Integrations.findOneByIdAndToken<IIncomingIntegration>(integrationId, decodeURIComponent(token));

		if (!integration) {
			incomingLogger.info({ msg: 'Invalid integration id or token', integrationId, token });

			throw new Error('Invalid integration id or token provided.');
		}

		routeContext.request.integration = integration;

		return Users.findOneById(routeContext.request.integration.userId);
	}

	override shouldAddRateLimitToRoute(options: { rateLimiterOptions?: RateLimiterOptions | boolean }): boolean {
		const { rateLimiterOptions } = options;
		return (
			(typeof rateLimiterOptions === 'object' || rateLimiterOptions === undefined) &&
			!process.env.TEST_MODE &&
			Boolean(defaultRateLimiterOptions.numRequestsAllowed && defaultRateLimiterOptions.intervalTimeInMS)
		);
	}

	override async shouldVerifyRateLimit(): Promise<boolean> {
		return (
			settings.get('API_Enable_Rate_Limiter') === true &&
			(process.env.NODE_ENV !== 'development' || settings.get('API_Enable_Rate_Limiter_Dev') === true)
		);
	}

	override async enforceRateLimit(
		objectForRateLimitMatch: RateLimiterOptionsToCheck,
		request: Request,
		response: Response,
		userId: string,
	): Promise<void> {
		const { method, url } = request;
		const route = url.replace(`/${this.apiPath}`, '');
		const nameRoute = this.getFullRouteName(route, method.toLowerCase());
		if (!this.getRateLimiter(nameRoute)) {
			this.addRateLimiterRuleForRoutes({
				routes: [route],
				rateLimiterOptions: defaultRateLimiterOptions,
				endpoints: {
					post: 'executeIntegrationRest',
					get: 'executeIntegrationRest',
				},
			});
		}

		const integrationForRateLimitMatch = objectForRateLimitMatch;
		integrationForRateLimitMatch.route = nameRoute;

		await super.enforceRateLimit(integrationForRateLimitMatch, request, response, userId);
	}
}

const Api = new WebHookAPI({
	enableCors: true,
	apiPath: 'hooks/',
	useDefaultAuth: false,
	prettyJson: process.env.NODE_ENV === 'development',
});

Api.router
	.use(loggerMiddleware(integrationLogger))
	.use(metricsMiddleware({ basePathRegex: new RegExp(/^\/hooks\//), api: Api, settings, summary: metrics.rocketchatRestApi }))
	.use(tracerSpanMiddleware);

const middleware = async (c: Context, next: Next): Promise<void> => {
	const { req } = c;
	if (req.raw.headers.get('content-type') !== 'application/x-www-form-urlencoded') {
		return next();
	}

	try {
		const content = await req.raw.clone().text();
		const body = Object.fromEntries(new URLSearchParams(content));
		if (!body || typeof body !== 'object' || Object.keys(body).length !== 1) {
			return next();
		}

		if (body.payload) {
			// need to compose the full payload in this weird way because body-parser thought it was a form
			c.set('bodyParams-override', JSON.parse(body.payload));
			return next();
		}
		incomingLogger.debug({
			msg: 'Body received as application/x-www-form-urlencoded without the "payload" key, parsed as string',
			content,
		});
		c.set('bodyParams-override', JSON.parse(content));
	} catch (e: any) {
		c.body(JSON.stringify({ success: false, error: e.message }), 400);
	}

	return next();
};

Api.router.use(middleware);

Api.addRoute(
	':integrationId/:userId/:token',
	{ authRequired: true },
	{
		post: executeIntegrationRest,
		get: executeIntegrationRest,
	},
);

Api.addRoute(
	':integrationId/:token',
	{ authRequired: true },
	{
		post: executeIntegrationRest,
		get: executeIntegrationRest,
	},
);

Api.addRoute(
	'sample/:integrationId/:userId/:token',
	{ authRequired: true },
	{
		get: integrationSampleRest,
	},
);

Api.addRoute(
	'sample/:integrationId/:token',
	{ authRequired: true },
	{
		get: integrationSampleRest,
	},
);

Api.addRoute(
	'info/:integrationId/:userId/:token',
	{ authRequired: true },
	{
		get: integrationInfoRest,
	},
);

Api.addRoute(
	'info/:integrationId/:token',
	{ authRequired: true },
	{
		get: integrationInfoRest,
	},
);

Api.addRoute(
	'add/:integrationId/:userId/:token',
	{ authRequired: true, validateParams: isIntegrationsHooksAddSchema },
	{
		async post() {
			const result = await createIntegration(this.bodyParams, this.user);

			return API.v1.success(result || {});
		},
	},
);

Api.addRoute(
	'add/:integrationId/:token',
	{ authRequired: true, validateParams: isIntegrationsHooksAddSchema },
	{
		async post() {
			const result = await createIntegration(this.bodyParams, this.user);

			return API.v1.success(result || {});
		},
	},
);

Api.addRoute(
	'remove/:integrationId/:userId/:token',
	{ authRequired: true, validateParams: isIntegrationsHooksRemoveSchema },
	{
		async post() {
			const result = await removeIntegration(this.bodyParams, this.user);

			return API.v1.success(result || {});
		},
	},
);

Api.addRoute(
	'remove/:integrationId/:token',
	{ authRequired: true, validateParams: isIntegrationsHooksRemoveSchema },
	{
		async post() {
			const result = await removeIntegration(this.bodyParams, this.user);

			return API.v1.success(result || {});
		},
	},
);

Meteor.startup(() => {
	(WebApp.rawConnectHandlers as unknown as ReturnType<typeof express>).use(Api.router.router);
});
