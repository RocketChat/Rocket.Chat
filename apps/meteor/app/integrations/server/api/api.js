import { Integrations, Users } from '@rocket.chat/models';
import * as Models from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Livechat } from 'meteor/rocketchat:livechat';
import moment from 'moment';
import _ from 'underscore';
import { VM, VMScript } from 'vm2';

import * as s from '../../../../lib/utils/stringUtils';
import { deasyncPromise } from '../../../../server/deasync/deasync';
import { httpCall } from '../../../../server/lib/http/call';
import { API, APIClass, defaultRateLimiterOptions } from '../../../api/server';
import { processWebhookMessage } from '../../../lib/server/functions/processWebhookMessage';
import { settings } from '../../../settings/server';
import { incomingLogger } from '../logger';
import { addOutgoingIntegration } from '../methods/outgoing/addOutgoingIntegration';
import { deleteOutgoingIntegration } from '../methods/outgoing/deleteOutgoingIntegration';

const DISABLE_INTEGRATION_SCRIPTS = ['yes', 'true'].includes(String(process.env.DISABLE_INTEGRATION_SCRIPTS).toLowerCase());

export const forbiddenModelMethods = ['registerModel', 'getCollectionName'];

const compiledScripts = {};
function buildSandbox(store = {}) {
	const httpAsync = async (method, url, options) => {
		try {
			return {
				result: await httpCall(method, url, options),
			};
		} catch (error) {
			return { error };
		}
	};

	const sandbox = {
		scriptTimeout(reject) {
			return setTimeout(() => reject('timed out'), 3000);
		},
		_,
		s,
		console,
		moment,
		Promise,
		Livechat,
		Store: {
			set(key, val) {
				store[key] = val;
				return val;
			},
			get(key) {
				return store[key];
			},
		},
		HTTP: (method, url, options) => {
			// TODO: deprecate, track and alert
			return deasyncPromise(httpAsync(method, url, options));
		},
		// TODO: Export fetch as the non deprecated method
	};
	Object.keys(Models)
		.filter((k) => !forbiddenModelMethods.includes(k))
		.forEach((k) => {
			sandbox[k] = Models[k];
		});
	return { store, sandbox };
}

function getIntegrationScript(integration) {
	if (DISABLE_INTEGRATION_SCRIPTS) {
		throw API.v1.failure('integration-scripts-disabled');
	}

	const compiledScript = compiledScripts[integration._id];
	if (compiledScript && +compiledScript._updatedAt === +integration._updatedAt) {
		return compiledScript.script;
	}

	const script = integration.scriptCompiled;
	const { sandbox, store } = buildSandbox();
	try {
		incomingLogger.info({ msg: 'Will evaluate script of Trigger', integration: integration.name });
		incomingLogger.debug(script);

		const vmScript = new VMScript(`${script}; Script;`, 'script.js');
		const vm = new VM({
			sandbox,
		});

		const ScriptClass = vm.run(vmScript);

		if (ScriptClass) {
			compiledScripts[integration._id] = {
				script: new ScriptClass(),
				store,
				_updatedAt: integration._updatedAt,
			};

			return compiledScripts[integration._id].script;
		}
	} catch (err) {
		incomingLogger.error({
			msg: 'Error evaluating Script in Trigger',
			integration: integration.name,
			script,
			err,
		});
		throw API.v1.failure('error-evaluating-script');
	}

	incomingLogger.error({ msg: 'Class "Script" not in Trigger', integration: integration.name });
	throw API.v1.failure('class-script-not-found');
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
	incomingLogger.info({ msg: 'Post integration:', integration: this.integration.name });
	incomingLogger.debug({ urlParams: this.urlParams, bodyParams: this.bodyParams });

	if (this.integration.enabled !== true) {
		return {
			statusCode: 503,
			body: 'Service Unavailable',
		};
	}

	const defaultValues = {
		channel: this.integration.channel,
		alias: this.integration.alias,
		avatar: this.integration.avatar,
		emoji: this.integration.emoji,
	};

	if (
		!DISABLE_INTEGRATION_SCRIPTS &&
		this.integration.scriptEnabled &&
		this.integration.scriptCompiled &&
		this.integration.scriptCompiled.trim() !== ''
	) {
		let script;
		try {
			script = getIntegrationScript(this.integration);
		} catch (e) {
			incomingLogger.error(e);
			return API.v1.failure(e.message);
		}

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

		try {
			const { sandbox } = buildSandbox(compiledScripts[this.integration._id].store);
			sandbox.script = script;
			sandbox.request = request;

			const vm = new VM({
				timeout: 3000,
				sandbox,
			});

			const result = await new Promise((resolve, reject) => {
				process.nextTick(async () => {
					try {
						const scriptResult = await vm.run(`
							new Promise((resolve, reject) => {
								scriptTimeout(reject);
								try {
									resolve(script.process_incoming_request({ request: request }));
								} catch(e) {
									reject(e);
								}
							}).catch((error) => { throw new Error(error); });
						`);

						resolve(scriptResult);
					} catch (e) {
						reject(e);
					}
				});
			});

			if (!result) {
				incomingLogger.debug({
					msg: 'Process Incoming Request result of Trigger has no data',
					integration: this.integration.name,
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
				integration: this.integration.name,
				result: this.bodyParams,
			});
		} catch (err) {
			incomingLogger.error({
				msg: 'Error running Script in Trigger',
				integration: this.integration.name,
				script: this.integration.scriptCompiled,
				err,
			});
			return API.v1.failure('error-running-script');
		}
	}

	// TODO: Turn this into an option on the integrations - no body means a success
	// TODO: Temporary fix for https://github.com/RocketChat/Rocket.Chat/issues/7770 until the above is implemented
	if (!this.bodyParams || (_.isEmpty(this.bodyParams) && !this.integration.scriptEnabled)) {
		// return RocketChat.API.v1.failure('body-empty');
		return API.v1.success();
	}

	if ((this.bodyParams.channel || this.bodyParams.roomId) && !this.integration.overrideDestinationChannelEnabled) {
		return API.v1.failure('overriding destination channel is disabled for this integration');
	}

	this.bodyParams.bot = { i: this.integration._id };

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

			this.integration = await Integrations.findOne({
				_id: this.request.params.integrationId,
				token: decodeURIComponent(this.request.params.token),
			});

			if (!this.integration) {
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
				_id: this.integration.userId,
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
