/* globals Api Meteor Restivus logger processWebhookMessage*/
// TODO: remove globals

import _ from 'underscore';
import s from 'underscore.string';
import vm from 'vm';
import moment from 'moment';

const compiledScripts = {};
function buildSandbox(store = {}) {
	const sandbox = {
		_,
		s,
		console,
		moment,
		Livechat: RocketChat.Livechat,
		Store: {
			set(key, val) {
				return store[key] = val;
			},
			get(key) {
				return store[key];
			}
		},
		HTTP(method, url, options) {
			try {
				return {
					result: HTTP.call(method, url, options)
				};
			} catch (error) {
				return {
					error
				};
			}
		}
	};

	Object.keys(RocketChat.models).filter((k) => !k.startsWith('_')).forEach((k) => sandbox[k] = RocketChat.models[k]);
	return { store, sandbox	};
}

function getIntegrationScript(integration) {
	const compiledScript = compiledScripts[integration._id];
	if ((compiledScript != null) && +compiledScript._updatedAt === +integration._updatedAt) {
		return compiledScript.script;
	}
	const script = integration.scriptCompiled;
	const {sandbox, store} = buildSandbox();
	try {
		logger.incoming.info('Will evaluate script of Trigger', integration.name);
		logger.incoming.debug(script);
		const vmScript = vm.createScript(script, 'script.js');
		vmScript.runInNewContext(sandbox);
		if (sandbox.Script != null) {
			compiledScripts[integration._id] = {
				script: new sandbox.Script(),
				store,
				_updatedAt: integration._updatedAt
			};
			return compiledScripts[integration._id].script;
		}
	} catch ({stack}) {
		logger.incoming.error('[Error evaluating Script in Trigger', integration.name, ':]');
		logger.incoming.error(script.replace(/^/gm, '  '));
		logger.incoming.error('[Stack:]');
		logger.incoming.error(stack.replace(/^/gm, '  '));
		throw RocketChat.API.v1.failure('error-evaluating-script');
	}
	if (sandbox.Script == null) {
		logger.incoming.error('[Class "Script" not in Trigger', integration.name, ']');
		throw RocketChat.API.v1.failure('class-script-not-found');
	}
}

Api = new Restivus({
	enableCors: true,
	apiPath: 'hooks/',
	auth: {
		user() {
			const payloadKeys = Object.keys(this.bodyParams);
			const payloadIsWrapped = (this.bodyParams && this.bodyParams.payload) && payloadKeys.length === 1;
			if (payloadIsWrapped && this.request.headers['content-type'] === 'application/x-www-form-urlencoded') {
				try {
					this.bodyParams = JSON.parse(this.bodyParams.payload);
				} catch ({message}) {
					return {
						error: {
							statusCode: 400,
							body: {
								success: false,
								error: message
							}
						}
					};
				}
			}

			this.integration = RocketChat.models.Integrations.findOne({
				_id: this.request.params.integrationId,
				token: decodeURIComponent(this.request.params.token)
			});
			if (this.integration == null) {
				logger.incoming.info('Invalid integration id', this.request.params.integrationId, 'or token', this.request.params.token);
				return;
			}
			const user = RocketChat.models.Users.findOne({
				_id: this.integration.userId
			});
			return {user};
		}
	}
});

function createIntegration(options, user) {
	logger.incoming.info('Add integration', options.name);
	logger.incoming.debug(options);
	Meteor.runAsUser(user._id, function() {
		switch (options['event']) {
			case 'newMessageOnChannel':
				if (options.data == null) {
					options.data = {};
				}
				if ((options.data.channel_name != null) && options.data.channel_name.indexOf('#') === -1) {
					options.data.channel_name = `#${ options.data.channel_name }`;
				}
				return Meteor.call('addOutgoingIntegration', {
					username: 'rocket.cat',
					urls: [options.target_url],
					name: options.name,
					channel: options.data.channel_name,
					triggerWords: options.data.trigger_words
				});
			case 'newMessageToUser':
				if (options.data.username.indexOf('@') === -1) {
					options.data.username = `@${ options.data.username }`;
				}
				return Meteor.call('addOutgoingIntegration', {
					username: 'rocket.cat',
					urls: [options.target_url],
					name: options.name,
					channel: options.data.username,
					triggerWords: options.data.trigger_words
				});
		}
	});
	return RocketChat.API.v1.success();
}

function removeIntegration(options, user) {
	logger.incoming.info('Remove integration');
	logger.incoming.debug(options);
	const integrationToRemove = RocketChat.models.Integrations.findOne({
		urls: options.target_url
	});
	Meteor.runAsUser(user._id, () => {
		return Meteor.call('deleteOutgoingIntegration', integrationToRemove._id);
	});
	return RocketChat.API.v1.success();
}

function executeIntegrationRest() {
	logger.incoming.info('Post integration:', this.integration.name);
	logger.incoming.debug('@urlParams:', this.urlParams);
	logger.incoming.debug('@bodyParams:', this.bodyParams);

	const url = this.request.url;
	const integration = this.integration;
	const data = this.bodyParams;
	const isIncoming = true;

	const historyId = RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, integration, data, url, step: 'start-execute-integration-rest' });

	if (this.integration.enabled !== true) {
		return {
			statusCode: 503,
			body: 'Service Unavailable'
		};
	}

	const defaultValues = {
		channel: this.integration.channel,
		alias: this.integration.alias,
		avatar: this.integration.avatar,
		emoji: this.integration.emoji
	};

	if (this.integration.scriptEnabled === true && this.integration.scriptCompiled && this.integration.scriptCompiled.trim() !== '') {
		let script;
		try {
			RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'before-get-integration-script' });
			script = getIntegrationScript(this.integration);
			RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'after-get-integration-script' });
		} catch (e) {
			RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, error: true });
			logger.incoming.warn(e);
			return RocketChat.API.v1.failure(e.message);
		}

		const request = {
			url: {
				hash: this.request._parsedUrl.hash,
				search: this.request._parsedUrl.search,
				query: this.queryParams,
				pathname: this.request._parsedUrl.pathname,
				path: this.request._parsedUrl.path
			},
			url_raw: this.request.url,
			url_params: this.urlParams,
			content: this.bodyParams,
			content_raw: this.request._readableState && this.request._readableState.buffer && this.request._readableState.buffer.toString(),
			headers: this.request.headers,
			user: {
				_id: this.user._id,
				name: this.user.name,
				username: this.user.username
			}
		};

		try {
			RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'before-script-sandbox' });

			const { sandbox } = buildSandbox(compiledScripts[this.integration._id].store);
			sandbox.script = script;
			sandbox.request = request;

			const result = vm.runInNewContext('script.process_incoming_request({ request: request })', sandbox, {
				timeout: 3000
			});

			if (!result) {
				RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'after-script-sandbox', finished: true });
				logger.incoming.debug('[Process Incoming Request result of Trigger', this.integration.name, ':] No data');
				return RocketChat.API.v1.success();
			} else if (result && result.error) {
				RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'after-script-sandbox', error: true });
				return RocketChat.API.v1.failure(result.error);
			}

			this.bodyParams = result && result.content;
			this.scriptResponse = result.response;
			if (result.user) {
				this.user = result.user;
			}

			logger.incoming.debug('[Process Incoming Request result of Trigger', this.integration.name, ':]');
			logger.incoming.debug('result', this.bodyParams);
			RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'after-script', finished: true });
		} catch ({stack}) {
			logger.incoming.error('[Error running Script in Trigger', this.integration.name, ':]');
			logger.incoming.error(this.integration.scriptCompiled.replace(/^/gm, '  '));
			logger.incoming.error('[Stack:]');
			logger.incoming.error(stack.replace(/^/gm, '  '));
			RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'after-script', error: true });
			return RocketChat.API.v1.failure('error-running-script');
		}
	}

	// TODO: Turn this into an option on the integrations - no body means a success
	// TODO: Temporary fix for https://github.com/RocketChat/Rocket.Chat/issues/7770 until the above is implemented
	if (!this.bodyParams) {
		RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'no-body-params', finished: true });
		// return RocketChat.API.v1.failure('body-empty');
		return RocketChat.API.v1.success();
	}

	this.bodyParams.bot = { i: this.integration._id };

	try {
		RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'process-webhook-message' });

		const message = processWebhookMessage(this.bodyParams, this.user, defaultValues, false, historyId);
		if (_.isEmpty(message)) {
			RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'webhook-message-empty', error: true });
			return RocketChat.API.v1.failure('unknown-error');
		}

		if (this.scriptResponse) {
			logger.incoming.debug('response', this.scriptResponse);
		}

		RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'message-processed', finished: true });
		return RocketChat.API.v1.success(this.scriptResponse);
	} catch ({ error }) {
		RocketChat.integrations.triggerHandler.updateHistory({ isIncoming, historyId, step: 'message-processed-with-error', error: true });
		return RocketChat.API.v1.failure(error);
	}
}

function addIntegrationRest() {
	return createIntegration(this.bodyParams, this.user);
}

function removeIntegrationRest() {
	return removeIntegration(this.bodyParams, this.user);
}

function integrationSampleRest() {
	logger.incoming.info('Sample Integration');
	return {
		statusCode: 200,
		body: [
			{
				token: Random.id(24),
				channel_id: Random.id(),
				channel_name: 'general',
				timestamp: new Date,
				user_id: Random.id(),
				user_name: 'rocket.cat',
				text: 'Sample text 1',
				trigger_word: 'Sample'
			}, {
				token: Random.id(24),
				channel_id: Random.id(),
				channel_name: 'general',
				timestamp: new Date,
				user_id: Random.id(),
				user_name: 'rocket.cat',
				text: 'Sample text 2',
				trigger_word: 'Sample'
			}, {
				token: Random.id(24),
				channel_id: Random.id(),
				channel_name: 'general',
				timestamp: new Date,
				user_id: Random.id(),
				user_name: 'rocket.cat',
				text: 'Sample text 3',
				trigger_word: 'Sample'
			}
		]
	};
}

function integrationInfoRest() {
	logger.incoming.info('Info integration');
	return {
		statusCode: 200,
		body: {
			success: true
		}
	};
}

Api.addRoute(':integrationId/:userId/:token', { authRequired: true }, {
	post: executeIntegrationRest,
	get: executeIntegrationRest
});

Api.addRoute(':integrationId/:token', { authRequired: true }, {
	post: executeIntegrationRest,
	get: executeIntegrationRest
});

Api.addRoute('sample/:integrationId/:userId/:token', { authRequired: true }, {
	get: integrationSampleRest
});

Api.addRoute('sample/:integrationId/:token', { authRequired: true }, {
	get: integrationSampleRest
});

Api.addRoute('info/:integrationId/:userId/:token', { authRequired: true }, {
	get: integrationInfoRest
});

Api.addRoute('info/:integrationId/:token', { authRequired: true }, {
	get: integrationInfoRest
});

Api.addRoute('add/:integrationId/:userId/:token', { authRequired: true }, {
	post: addIntegrationRest
});

Api.addRoute('add/:integrationId/:token', { authRequired: true }, {
	post: addIntegrationRest
});

Api.addRoute('remove/:integrationId/:userId/:token', { authRequired: true }, {
	post: removeIntegrationRest
});

Api.addRoute('remove/:integrationId/:token', { authRequired: true }, {
	post: removeIntegrationRest
});
