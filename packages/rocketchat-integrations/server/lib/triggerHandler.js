/* global logger, processWebhookMessage */
class RocketChatIntegrationHandler {
	constructor() {
		this.vm = Npm.require('vm');
		this.successResults = [200, 201, 202];
		this.compiledScripts = {};
		this.triggers = {};

		const self = this;

		RocketChat.models.Integrations.find({type: 'webhook-outgoing'}).observe({
			added: (record) => {
				this.addIntegration(record);
			},

			changed(record) {
				self.removeIntegration(record);
				self.addIntegration(record);
			},

			removed(record) {
				self.removeIntegration(record);
			}
		});
	}

	addIntegration(record) {
		let channels;
		if (_.isEmpty(record.channel)) {
			channels = ['__any'];
		} else {
			channels = [].concat(record.channel);
		}

		for (const channel of channels) {
			if (!this.triggers[channel]) {
				this.triggers[channel] = {};
			}

			this.triggers[channel][record._id] = record;
		}
	}

	removeIntegration(record) {
		for (const trigger of Object.values(this.triggers)) {
			delete trigger[record._id];
		}
	}

	getIntegrationScript(integration) {
		const compiledScript = this.compiledScripts[integration._id];
		if (compiledScript && +compiledScript._updatedAt === +integration._updatedAt) {
			return compiledScript.script;
		}

		const script = integration.scriptCompiled;
		const store = {};
		const sandbox = {
			_, s, console,
			Store: {
				set: (key, val) => store[key] = val,
				get: (key) => store[key]
			},
			HTTP: (method, url, options) => {
				try {
					return {
						result: HTTP.call(method, url, options)
					};
				} catch (error) {
					return { error };
				}
			}
		};

		let vmScript;
		try {
			logger.outgoing.info('Will evaluate script of Trigger', integration.name);
			logger.outgoing.debug(script);

			vmScript = this.vm.createScript(script, 'script.js');

			vmScript.runInNewContext(sandbox);

			if (sandbox.Script) {
				this.compiledScripts[integration._id] = {
					script: new sandbox.Script(),
					_updatedAt: integration._updatedAt
				};

				return this.compiledScripts[integration._id].script;
			}
		} catch (e) {
			logger.outgoing.error(`[Error evaluating Script in Trigger ${integration.name}]:`);
			logger.outgoing.error(script.replace(/^/gm, '  '));
			logger.outgoing.error('[Stack:]');
			logger.outgoing.error(e.stack.replace(/^/gm, '  '));
			throw new Meteor.Error('error-evaluating-script');
		}

		if (!sandbox.Script) {
			logger.outgoing.error(`[Class "Script" not in Trigger ${integration.name}]:`);
			throw new Meteor.Error('class-script-not-found');
		}
	}

	hasScriptAndMethod(integration, method) {
		if (integration.scriptEnabled !== true || !integration.scriptCompiled || integration.scriptCompiled.trim() === '') {
			return false;
		}

		let script;
		try {
			script = this.getIntegrationScript(integration);
		} catch (e) {
			return false;
		}

		return typeof script[method] !== 'undefined';
	}

	executeScript(integration, method, params) {
		let script;
		try {
			script = this.getIntegrationScript(integration);
		} catch (e) {
			return;
		}

		if (!script[method]) {
			logger.outgoing.error(`[Method "${method}" no found in the Integration "${integration.name}"]`);
			return;
		}

		try {
			const result = script[method](params);

			logger.outgoing.debug(`[Script method "${method}" result of the Integration "${integration.name}" is]:`);
			logger.outgoing.debug(result);

			return result;
		} catch (e) {
			logger.incoming.error(`[Error running Script in the Integration ${integration.name}]:`);
			logger.incoming.error(integration.scriptCompiled.replace(/^/gm, '  '));
			logger.incoming.error('[Stack]:');
			logger.incoming.error(e.stack.replace(/^/gm, '  '));
			return;
		}
	}

	executeTriggers(message, room) {
		if (!room) {
			return;
		}

		const triggersToExecute = [];

		switch (room.t) {
			case 'd':
				const id = room._id.replace(message.u._id, '');

				let username = _.without(room.usernames, message.u.username)[0];

				if (this.triggers['@'+id]) {
					for (const trigger of Object.values(this.triggers['@'+id])) {
						triggersToExecute.push(trigger);
					}
				}

				if (this.triggers.all_direct_messages) {
					for (const trigger of Object.values(this.triggers.all_direct_messages)) {
						triggersToExecute.push(trigger);
					}
				}

				if (id !== username && this.triggers['@'+username]) {
					for (const trigger of Object.values(this.triggers['@'+username])) {
						triggersToExecute.push(trigger);
					}
				}
				break;

			case 'c':
				if (this.triggers.__any) {
					for (const trigger of Object.values(this.triggers.__any)) {
						triggersToExecute.push(trigger);
					}
				}

				if (this.triggers.all_public_channels) {
					for (const trigger of Object.values(this.triggers.all_public_channels)) {
						triggersToExecute.push(trigger);
					}
				}

				if (this.triggers['#'+room._id]) {
					for (const trigger of Object.values(this.triggers['#'+room._id])) {
						triggersToExecute.push(trigger);
					}
				}

				if (room._id !== room.name && this.triggers['#'+room.name]) {
					for (const trigger of Object.values(this.triggers['#'+room.name])) {
						triggersToExecute.push(trigger);
					}
				}
				break;

			default:
				if (this.triggers.all_private_groups) {
					for (const trigger of Object.values(this.triggers.all_private_groups)) {
						triggersToExecute.push(trigger);
					}
				}

				if (this.triggers['#'+room._id]) {
					for (const trigger of Object.values(this.triggers['#'+room._id])) {
						triggersToExecute.push(trigger);
					}
				}

				if (room._id !== room.name && this.triggers['#'+room.name]) {
					for (const trigger of Object.values(this.triggers['#'+room.name])) {
						triggersToExecute.push(trigger);
					}
				}
				break;
		}


		for (const triggerToExecute of triggersToExecute) {
			if (triggerToExecute.enabled === true) {
				this.executeTrigger(triggerToExecute, message, room);
			}
		}

		return message;
	}

	executeTrigger(trigger, message, room) {
		for (const url of trigger.urls) {
			this.executeTriggerUrl(url, trigger, message, room);
		}
	}

	executeTriggerUrl(url, trigger, message, room, tries = 0) {
		let word;
		if (trigger.triggerWords && trigger.triggerWords.length > 0) {
			for (const triggerWord of trigger.triggerWords) {
				if (message.msg.indexOf(triggerWord) === 0) {
					word = triggerWord;
					break;
				}
			}

			// Stop if there are triggerWords but none match
			if (!word) {
				return;
			}
		}

		const data = {
			message_id: message._id,
			token: trigger.token,
			channel_id: room._id,
			channel_name: room.name,
			timestamp: message.ts,
			user_id: message.u._id,
			user_name: message.u.username,
			text: message.msg
		};

		if (message.alias) {
			data.alias = message.alias;
		}

		if (message.bot) {
			data.bot = message.bot;
		} else {
			data.bot = false;
		}

		if (word) {
			data.trigger_word = word;
		}

		logger.outgoing.info(`Will be executing the Integration "${trigger.name}" to the url: ${url}`);
		logger.outgoing.debug(data);

		const sendMessage = (message) => {
			let user;
			if (trigger.impersonateUser) {
				user = RocketChat.models.Users.findOneByUsername(data.user_name);
			} else {
				user = RocketChat.models.Users.findOneByUsername(trigger.username);
			}

			message.bot = { i: trigger._id };

			const defaultValues = {
				alias: trigger.alias,
				avatar: trigger.avatar,
				emoji: trigger.emoji
			};

			if (room.t === 'd') {
				message.channel = '@'+room._id;
			} else {
				message.channel = '#'+room._id;
			}

			message = processWebhookMessage(message, user, defaultValues);
		};

		let opts = {
			params: {},
			method: 'POST',
			url,
			data,
			auth: undefined,
			npmRequestOptions: {
				rejectUnauthorized: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs'),
				strictSSL: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs')
			},
			headers: {
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'
			}
		};

		if (this.hasScriptAndMethod(trigger, 'prepare_outgoing_request')) {
			const sandbox = { request: opts };

			opts = this.executeScript(trigger, 'prepare_outgoing_request', sandbox);
		}

		if (!opts) {
			return;
		}

		if (opts.message) {
			sendMessage(opts.message);
		}

		if (!opts.url || !opts.method) {
			return;
		}

		HTTP.call(opts.method, opts.url, opts, (error, result) => {
			if (!result) {
				logger.outgoing.info(`Result for the Integration ${trigger.name} to ${url} is empty`);
			} else {
				logger.outgoing.info(`Status code for the Integration ${trigger.name} to ${url} is ${result.statusCode}`);
			}

			if (this.hasScriptAndMethod(trigger, 'process_outgoing_response')) {
				const sandbox = {
					request: opts,
					response: {
						error,
						status_code: result.statusCode,
						content: result.data,
						content_raw: result.content,
						headers: result.headers
					}
				};

				const scriptResult = this.executeScript(trigger, 'process_outgoing_response', sandbox);

				if (scriptResult && scriptResult.content) {
					sendMessage(scriptResult.content);
					return;
				}

				if (scriptResult === false) {
					return;
				}
			}

			// if the result contained nothing or wasn't a successful statusCode
			if (!result || !this.successResults.includes(result.statusCode)) {
				if (error) {
					logger.outgoing.error(`Error for the Integration "${trigger.name}" to ${url} is:`);
					logger.outgoing.error(error);
				}

				if (result) {
					logger.outgoing.error(`Error for the Integration "${trigger.name}" to ${url} is:`);
					logger.outgoing.error(result);

					if (result.statusCode === 410) {
						logger.outgoing.error(`Disabling the Integration "${trigger.name}" because the status code was 401 (Gone).`);
						RocketChat.models.Integrations.update({ _id: trigger._id }, { $set: { enabled: false }});
						return;
					}

					if (result.statusCode === 500) {
						logger.outgoing.error(`Error [500] for the Integration "${trigger.name}" to ${url}.`);
						logger.outgoing.error(result.content);
						return;
					}
				}

				if (tries <= 6) {
					// Try again in 0.1s, 1s, 10s, 1m40s, 16m40s, 2h46m40s and 27h46m40s
					const waitTime = Math.pow(10, tries+2);
					logger.outgoing.info(`Trying the Integration ${trigger.name} to ${url} again in ${waitTime} milliseconds.`);
					Meteor.setTimeout(() => {
						this.executeTriggerUrl(url, trigger, message, room, tries+1);
					}, waitTime);
				}

				return;
			}

			//process outgoing webhook response as a new message
			if (result && this.successResults.includes(result.statusCode)) {
				if (result && result.data && (result.data.text || result.data.attachments)) {
					sendMessage(result.data);
				}
			}
		});
	}
}

RocketChat.integrations.triggerHandler = new RocketChatIntegrationHandler();
