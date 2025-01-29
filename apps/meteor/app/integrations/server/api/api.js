import { Integrations, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import _ from 'underscore';

import { API, APIClass, defaultRateLimiterOptions } from '../../../api/server/api';
import { processWebhookMessage } from '../../../lib/server/functions/processWebhookMessage';
import { settings } from '../../../settings/server';
import { IsolatedVMScriptEngine } from '../lib/isolated-vm/isolated-vm';
import { incomingLogger } from '../logger';
import { addOutgoingIntegration } from '../methods/outgoing/addOutgoingIntegration';
import { deleteOutgoingIntegration } from '../methods/outgoing/deleteOutgoingIntegration';

const ivmEngine = new IsolatedVMScriptEngine(true);

// eslint-disable-next-line no-unused-vars
function getEngine(_integration) {
	return ivmEngine;
}

async function createIntegration(options, user) {
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
			});
		case 'newMessageToUser':
			if (options.data.username.indexOf('@') === -1) {
				options.data.username = `@${options.data.username}`;
			}
			return addOutgoingIntegration(user._id, {
				username: 'rocket.cat',
				urls: [options.target_url],
				name: options.name,
				channel: options.data.username,
				triggerWords: options.data.trigger_words,
			});
	}

	return API.v1.success();
}

async function removeIntegration(options, user) {
	incomingLogger.info('Remove integration');
	incomingLogger.debug({ options });

	const integrationToRemove = await Integrations.findOneByUrl(options.target_url);
	if (!integrationToRemove) {
		return API.v1.failure('integration-not-found');
	}

	await deleteOutgoingIntegration(integrationToRemove._id, user._id);

	return API.v1.success();
}

async function executeIntegrationRest() {
	incomingLogger.info({ msg: 'Post integration:', integration: this.request.integration.name });
	incomingLogger.debug({ urlParams: this.urlParams, bodyParams: this.bodyParams });

	if (this.request.integration.enabled !== true) {
		return {
			statusCode: 503,
			body: 'Service Unavailable',
		};
	}

	const defaultValues = {
		channel: this.request.integration.channel,
		alias: this.request.integration.alias,
		avatar: this.request.integration.avatar,
		emoji: this.request.integration.emoji,
	};

	const scriptEngine = getEngine(this.request.integration);

	if (scriptEngine.integrationHasValidScript(this.request.integration)) {
		this.request.setEncoding('utf8');
		const content_raw = this.request.read();

		const request = {
			url: {
				hash: this.request._parsedUrl.hash,
				search: this.request._parsedUrl.search,
				query: this.queryParams,
				pathname: this.request._parsedUrl.pathname,
				path: this.request._parsedUrl.path,
			},
			url_raw: this.request.url,
			url_params: this.urlParams,
			content: this.bodyParams,
			content_raw,
			headers: this.request.headers,
			body: this.request.body,
			user: {
				_id: this.user._id,
				name: this.user.name,
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
			if (result && result.error) {
				return API.v1.failure(result.error);
			}

			this.bodyParams = result && result.content;
			this.scriptResponse = result.response;
			if (result.user) {
				this.user = result.user;
			}

			incomingLogger.debug({
				msg: 'Process Incoming Request result of Trigger',
				integration: this.request.integration.name,
				result: this.bodyParams,
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

	// TODO: Turn this into an option on the integrations - no body means a success
	// TODO: Temporary fix for https://github.com/RocketChat/Rocket.Chat/issues/7770 until the above is implemented
	if (!this.bodyParams || (_.isEmpty(this.bodyParams) && !this.request.integration.scriptEnabled)) {
		// return RocketChat.API.v1.failure('body-empty');
		return API.v1.success();
	}

	if ((this.bodyParams.channel || this.bodyParams.roomId) && !this.request.integration.overrideDestinationChannelEnabled) {
		return API.v1.failure('overriding destination channel is disabled for this integration');
	}

	this.bodyParams.bot = { i: this.request.integration._id };

	try {
		const message = await processWebhookMessage(this.bodyParams, this.user, defaultValues);
		if (_.isEmpty(message)) {
			return API.v1.failure('unknown-error');
		}

		if (this.scriptResponse) {
			incomingLogger.debug({ msg: 'response', response: this.scriptResponse });
		}

		return API.v1.success(this.scriptResponse);
	} catch ({ error, message }) {
		return API.v1.failure(error || message);
	}
}

function addIntegrationRest() {
	return createIntegration(this.bodyParams, this.user);
}

async function removeIntegrationRest() {
	return removeIntegration(this.bodyParams, this.user);
}

function integrationSampleRest() {
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

function integrationInfoRest() {
	incomingLogger.info('Info integration');
	return {
		statusCode: 200,
		body: {
			success: true,
		},
	};
}

class WebHookAPI extends APIClass {
	async authenticatedRoute(request) {
		const payloadKeys = Object.keys(request.body);
		const payloadIsWrapped = request.body && request.body.payload && payloadKeys.length === 1;
		if (payloadIsWrapped && request.headers['content-type'] === 'application/x-www-form-urlencoded') {
			try {
				request.body = JSON.parse(request.body.payload);
			} catch ({ message }) {
				return {
					error: {
						statusCode: 400,
						body: {
							success: false,
							error: message,
						},
					},
				};
			}
		}

		request.integration = await Integrations.findOne({
			_id: request.params.integrationId,
			token: decodeURIComponent(request.params.token),
		});

		if (!request.integration) {
			incomingLogger.info(`Invalid integration id ${request.params.integrationId} or token ${request.params.token}`);

			return {
				error: {
					statusCode: 404,
					body: {
						success: false,
						error: 'Invalid integration id or token provided.',
					},
				},
			};
		}

		return Users.findOneById(request.integration.userId);
	}

	/* Webhooks are not versioned, so we must not validate we know a version before adding a rate limiter */
	shouldAddRateLimitToRoute(options) {
		const { rateLimiterOptions } = options;
		return (
			(typeof rateLimiterOptions === 'object' || rateLimiterOptions === undefined) &&
			!process.env.TEST_MODE &&
			Boolean(defaultRateLimiterOptions.numRequestsAllowed && defaultRateLimiterOptions.intervalTimeInMS)
		);
	}

	async shouldVerifyRateLimit(/* route */) {
		return (
			settings.get('API_Enable_Rate_Limiter') === true &&
			(process.env.NODE_ENV !== 'development' || settings.get('API_Enable_Rate_Limiter_Dev') === true)
		);
	}

	/*
	There is only one generic route propagated to Restivus which has URL-path-parameters for the integration and the token.
	Since the rate-limiter operates on absolute routes, we need to add a limiter to the absolute url before we can validate it
	*/
	async enforceRateLimit(objectForRateLimitMatch, request, response, userId) {
		const { method, url } = request;
		const route = url.replace(`/${this.apiPath}`, '');
		const nameRoute = this.getFullRouteName(route, [method.toLowerCase()]);
		// We'll be creating rate limiters on demand (when validating for the first time).
		// This is possible since *all* integration hooks should be rate limited the same way.
		// This way, we'll not have to add new limiters as new integrations are added
		if (!this.getRateLimiter(nameRoute)) {
			this.addRateLimiterRuleForRoutes({
				routes: [route],
				rateLimiterOptions: defaultRateLimiterOptions,
				endpoints: {
					post: executeIntegrationRest,
					get: executeIntegrationRest,
				},
			});
		}

		const integrationForRateLimitMatch = objectForRateLimitMatch;
		integrationForRateLimitMatch.route = nameRoute;

		super.enforceRateLimit(integrationForRateLimitMatch, request, response, userId);
	}
}

const Api = new WebHookAPI({
	enableCors: true,
	apiPath: 'hooks/',
	auth: {
		async user() {
			const payloadKeys = Object.keys(this.bodyParams);
			const payloadIsWrapped = this.bodyParams && this.bodyParams.payload && payloadKeys.length === 1;
			if (payloadIsWrapped && this.request.headers['content-type'] === 'application/x-www-form-urlencoded') {
				try {
					this.bodyParams = JSON.parse(this.bodyParams.payload);
				} catch ({ message }) {
					return {
						error: {
							statusCode: 400,
							body: {
								success: false,
								error: message,
							},
						},
					};
				}
			}

			this.request.integration = await Integrations.findOne({
				_id: this.request.params.integrationId,
				token: decodeURIComponent(this.request.params.token),
			});

			if (!this.request.integration) {
				incomingLogger.info(`Invalid integration id ${this.request.params.integrationId} or token ${this.request.params.token}`);

				return {
					error: {
						statusCode: 404,
						body: {
							success: false,
							error: 'Invalid integration id or token provided.',
						},
					},
				};
			}

			const user = await Users.findOne({
				_id: this.request.integration.userId,
			});

			return { user };
		},
	},
});

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
	{ authRequired: true },
	{
		post: addIntegrationRest,
	},
);

Api.addRoute(
	'add/:integrationId/:token',
	{ authRequired: true },
	{
		post: addIntegrationRest,
	},
);

Api.addRoute(
	'remove/:integrationId/:userId/:token',
	{ authRequired: true },
	{
		post: removeIntegrationRest,
	},
);

Api.addRoute(
	'remove/:integrationId/:token',
	{ authRequired: true },
	{
		post: removeIntegrationRest,
	},
);

Meteor.startup(() => {
	WebApp.connectHandlers.use(Api.router.router);
});
