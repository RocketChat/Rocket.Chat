/* global logger, processWebhookMessage */
import moment from 'moment';

RocketChat.integrations.triggerHandler = new class RocketChatIntegrationHandler {
	constructor() {
		this.vm = Npm.require('vm');
		this.successResults = [200, 201, 202];
		this.compiledScripts = {};
		this.triggers = {};

		RocketChat.models.Integrations.find({type: 'webhook-outgoing'}).observe({
			added: (record) => {
				this.addIntegration(record);
			},

			changed: (record) => {
				this.removeIntegration(record);
				this.addIntegration(record);
			},

			removed: (record) => {
				this.removeIntegration(record);
			}
		});
	}

	addIntegration(record) {
		logger.outgoing.debug(`Adding the integration ${ record.name } of the event ${ record.event }!`);
		let channels;
		if (record.event && !RocketChat.integrations.outgoingEvents[record.event].use.channel) {
			logger.outgoing.debug('The integration doesnt rely on channels.');
			//We don't use any channels, so it's special ;)
			channels = ['__any'];
		} else if (_.isEmpty(record.channel)) {
			logger.outgoing.debug('The integration had an empty channel property, so it is going on all the public channels.');
			channels = ['all_public_channels'];
		} else {
			logger.outgoing.debug('The integration is going on these channels:', record.channel);
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

	updateHistory({ historyId, step, integration, event, data, triggerWord, ranPrepareScript, prepareSentMessage, processSentMessage, resultMessage, finished, url, httpCallData, httpError, httpResult, error, errorStack }) {
		const history = {
			type: 'outgoing-webhook',
			step
		};

		// Usually is only added on initial insert
		if (integration) {
			history.integration = integration;
		}

		// Usually is only added on initial insert
		if (event) {
			history.event = event;
		}

		if (data) {
			history.data = data;

			if (data.user) {
				history.data.user = _.omit(data.user, ['meta', '$loki', 'services']);
			}

			if (data.room) {
				history.data.room = _.omit(data.room, ['meta', '$loki', 'usernames']);
				history.data.room.usernames = ['this_will_be_filled_in_with_usernames_when_replayed'];
			}
		}

		if (triggerWord) {
			history.triggerWord = triggerWord;
		}

		if (typeof ranPrepareScript !== 'undefined') {
			history.ranPrepareScript = ranPrepareScript;
		}

		if (prepareSentMessage) {
			history.prepareSentMessage = prepareSentMessage;
		}

		if (processSentMessage) {
			history.processSentMessage = processSentMessage;
		}

		if (resultMessage) {
			history.resultMessage = resultMessage;
		}

		if (typeof finished !== 'undefined') {
			history.finished = finished;
		}

		if (url) {
			history.url = url;
		}

		if (typeof httpCallData !== 'undefined') {
			history.httpCallData = httpCallData;
		}

		if (httpError) {
			history.httpError = httpError;
		}

		if (typeof httpResult !== 'undefined') {
			history.httpResult = httpResult;
		}

		if (typeof error !== 'undefined') {
			history.error = error;
		}

		if (typeof errorStack !== 'undefined') {
			history.errorStack = errorStack;
		}

		if (historyId) {
			RocketChat.models.IntegrationHistory.update({ _id: historyId }, { $set: history });
			return historyId;
		} else {
			history._createdAt = new Date();
			return RocketChat.models.IntegrationHistory.insert(Object.assign({ _id: Random.id() }, history));
		}
	}

	//Trigger is the trigger, nameOrId is a string which is used to try and find a room, room is a room, message is a message, and data contains "user_name" if trigger.impersonateUser is truthful.
	sendMessage({ trigger, nameOrId = '', room, message, data }) {
		let user;
		//Try to find the user who we are impersonating
		if (trigger.impersonateUser) {
			user = RocketChat.models.Users.findOneByUsername(data.user_name);
		}

		//If they don't exist (aka the trigger didn't contain a user) then we set the user based upon the
		//configured username for the integration since this is required at all times.
		if (!user) {
			user = RocketChat.models.Users.findOneByUsername(trigger.username);
		}

		let tmpRoom;
		if (nameOrId || trigger.targetRoom) {
			tmpRoom = RocketChat.getRoomByNameOrIdWithOptionToJoin({ currentUserId: user._id, nameOrId: nameOrId || trigger.targetRoom, errorOnEmpty: false }) || room;
		} else {
			tmpRoom = room;
		}

		//If no room could be found, we won't be sending any messages but we'll warn in the logs
		if (!tmpRoom) {
			logger.outgoing.warn(`The Integration "${ trigger.name }" doesn't have a room configured nor did it provide a room to send the message to.`);
			return;
		}

		logger.outgoing.debug(`Found a room for ${ trigger.name } which is: ${ tmpRoom.name } with a type of ${ tmpRoom.t }`);

		message.bot = { i: trigger._id };

		const defaultValues = {
			alias: trigger.alias,
			avatar: trigger.avatar,
			emoji: trigger.emoji
		};

		if (tmpRoom.t === 'd') {
			message.channel = `@${ tmpRoom._id }`;
		} else {
			message.channel = `#${ tmpRoom._id }`;
		}

		message = processWebhookMessage(message, user, defaultValues);
		return message;
	}

	buildSandbox(store = {}) {
		const sandbox = {
			_, s, console, moment,
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

		Object.keys(RocketChat.models).filter(k => !k.startsWith('_')).forEach(k => {
			sandbox[k] = RocketChat.models[k];
		});

		return { store, sandbox };
	}

	getIntegrationScript(integration) {
		const compiledScript = this.compiledScripts[integration._id];
		if (compiledScript && +compiledScript._updatedAt === +integration._updatedAt) {
			return compiledScript.script;
		}

		const script = integration.scriptCompiled;
		const { store, sandbox } = this.buildSandbox();

		let vmScript;
		try {
			logger.outgoing.info('Will evaluate script of Trigger', integration.name);
			logger.outgoing.debug(script);

			vmScript = this.vm.createScript(script, 'script.js');

			vmScript.runInNewContext(sandbox);

			if (sandbox.Script) {
				this.compiledScripts[integration._id] = {
					script: new sandbox.Script(),
					store,
					_updatedAt: integration._updatedAt
				};

				return this.compiledScripts[integration._id].script;
			}
		} catch (e) {
			logger.outgoing.error(`Error evaluating Script in Trigger ${ integration.name }:`);
			logger.outgoing.error(script.replace(/^/gm, '  '));
			logger.outgoing.error('Stack Trace:');
			logger.outgoing.error(e.stack.replace(/^/gm, '  '));
			throw new Meteor.Error('error-evaluating-script');
		}

		if (!sandbox.Script) {
			logger.outgoing.error(`Class "Script" not in Trigger ${ integration.name }:`);
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

	executeScript(integration, method, params, historyId) {
		let script;
		try {
			script = this.getIntegrationScript(integration);
		} catch (e) {
			this.updateHistory({ historyId, step: 'execute-script-getting-script', error: true, errorStack: e });
			return;
		}

		if (!script[method]) {
			logger.outgoing.error(`Method "${ method }" no found in the Integration "${ integration.name }"`);
			this.updateHistory({ historyId, step: `execute-script-no-method-${ method }` });
			return;
		}

		try {
			const { sandbox } = this.buildSandbox(this.compiledScripts[integration._id].store);
			sandbox.script = script;
			sandbox.method = method;
			sandbox.params = params;

			this.updateHistory({ historyId, step: `execute-script-before-running-${ method }` });
			const result = this.vm.runInNewContext('script[method](params)', sandbox, { timeout: 3000 });

			logger.outgoing.debug(`Script method "${ method }" result of the Integration "${ integration.name }" is:`);
			logger.outgoing.debug(result);

			return result;
		} catch (e) {
			this.updateHistory({ historyId, step: `execute-script-error-running-${ method }`, error: true, errorStack: e.stack.replace(/^/gm, '  ') });
			logger.outgoing.error(`Error running Script in the Integration ${ integration.name }:`);
			logger.outgoing.debug(integration.scriptCompiled.replace(/^/gm, '  ')); // Only output the compiled script if debugging is enabled, so the logs don't get spammed.
			logger.outgoing.error('Stack:');
			logger.outgoing.error(e.stack.replace(/^/gm, '  '));
			return;
		}
	}

	eventNameArgumentsToObject() {
		const argObject = {
			event: arguments[0]
		};

		switch (argObject.event) {
			case 'sendMessage':
				if (arguments.length >= 3) {
					argObject.message = arguments[1];
					argObject.room = arguments[2];
				}
				break;
			case 'fileUploaded':
				if (arguments.length >= 2) {
					const arghhh = arguments[1];
					argObject.user = arghhh.user;
					argObject.room = arghhh.room;
					argObject.message = arghhh.message;
				}
				break;
			case 'roomArchived':
				if (arguments.length >= 3) {
					argObject.room = arguments[1];
					argObject.user = arguments[2];
				}
				break;
			case 'roomCreated':
				if (arguments.length >= 3) {
					argObject.owner = arguments[1];
					argObject.room = arguments[2];
				}
				break;
			case 'roomJoined':
			case 'roomLeft':
				if (arguments.length >= 3) {
					argObject.user = arguments[1];
					argObject.room = arguments[2];
				}
				break;
			case 'userCreated':
				if (arguments.length >= 2) {
					argObject.user = arguments[1];
				}
				break;
			default:
				logger.outgoing.warn(`An Unhandled Trigger Event was called: ${ argObject.event }`);
				argObject.event = undefined;
				break;
		}

		logger.outgoing.debug(`Got the event arguments for the event: ${ argObject.event }`, argObject);

		return argObject;
	}

	mapEventArgsToData(data, { event, message, room, owner, user }) {
		switch (event) {
			case 'sendMessage':
				data.channel_id = room._id;
				data.channel_name = room.name;
				data.message_id = message._id;
				data.timestamp = message.ts;
				data.user_id = message.u._id;
				data.user_name = message.u.username;
				data.text = message.msg;

				if (message.alias) {
					data.alias = message.alias;
				}

				if (message.bot) {
					data.bot = message.bot;
				}
				break;
			case 'fileUploaded':
				data.channel_id = room._id;
				data.channel_name = room.name;
				data.message_id = message._id;
				data.timestamp = message.ts;
				data.user_id = message.u._id;
				data.user_name = message.u.username;
				data.text = message.msg;
				data.user = user;
				data.room = room;
				data.message = message;

				if (message.alias) {
					data.alias = message.alias;
				}

				if (message.bot) {
					data.bot = message.bot;
				}
				break;
			case 'roomCreated':
				data.channel_id = room._id;
				data.channel_name = room.name;
				data.timestamp = room.ts;
				data.user_id = owner._id;
				data.user_name = owner.username;
				data.owner = owner;
				data.room = room;
				break;
			case 'roomArchived':
			case 'roomJoined':
			case 'roomLeft':
				data.timestamp = new Date();
				data.channel_id = room._id;
				data.channel_name = room.name;
				data.user_id = user._id;
				data.user_name = user.username;
				data.user = user;
				data.room = room;

				if (user.type === 'bot') {
					data.bot = true;
				}
				break;
			case 'userCreated':
				data.timestamp = user.createdAt;
				data.user_id = user._id;
				data.user_name = user.username;
				data.user = user;

				if (user.type === 'bot') {
					data.bot = true;
				}
				break;
			default:
				break;
		}
	}

	executeTriggers() {
		logger.outgoing.debug('Execute Trigger:', arguments[0]);

		const argObject = this.eventNameArgumentsToObject(...arguments);
		const { event, message, room } = argObject;

		//Each type of event should have an event and a room attached, otherwise we
		//wouldn't know how to handle the trigger nor would we have anywhere to send the
		//result of the integration
		if (!event) {
			return;
		}

		const triggersToExecute = [];

		logger.outgoing.debug('Starting search for triggers for the room:', room ? room._id : '__any');
		if (room) {
			switch (room.t) {
				case 'd':
					const id = room._id.replace(message.u._id, '');
					const username = _.without(room.usernames, message.u.username)[0];

					if (this.triggers[`@${ id }`]) {
						for (const trigger of Object.values(this.triggers[`@${ id }`])) {
							triggersToExecute.push(trigger);
						}
					}

					if (this.triggers.all_direct_messages) {
						for (const trigger of Object.values(this.triggers.all_direct_messages)) {
							triggersToExecute.push(trigger);
						}
					}

					if (id !== username && this.triggers[`@${ username }`]) {
						for (const trigger of Object.values(this.triggers[`@${ username }`])) {
							triggersToExecute.push(trigger);
						}
					}
					break;

				case 'c':
					if (this.triggers.all_public_channels) {
						for (const trigger of Object.values(this.triggers.all_public_channels)) {
							triggersToExecute.push(trigger);
						}
					}

					if (this.triggers[`#${ room._id }`]) {
						for (const trigger of Object.values(this.triggers[`#${ room._id }`])) {
							triggersToExecute.push(trigger);
						}
					}

					if (room._id !== room.name && this.triggers[`#${ room.name }`]) {
						for (const trigger of Object.values(this.triggers[`#${ room.name }`])) {
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

					if (this.triggers[`#${ room._id }`]) {
						for (const trigger of Object.values(this.triggers[`#${ room._id }`])) {
							triggersToExecute.push(trigger);
						}
					}

					if (room._id !== room.name && this.triggers[`#${ room.name }`]) {
						for (const trigger of Object.values(this.triggers[`#${ room.name }`])) {
							triggersToExecute.push(trigger);
						}
					}
					break;
			}
		}

		if (this.triggers.__any) {
			//For outgoing integration which don't rely on rooms.
			for (const trigger of Object.values(this.triggers.__any)) {
				triggersToExecute.push(trigger);
			}
		}

		logger.outgoing.debug(`Found ${ triggersToExecute.length } to iterate over and see if the match the event.`);

		for (const triggerToExecute of triggersToExecute) {
			logger.outgoing.debug(`Is ${ triggerToExecute.name } enabled, ${ triggerToExecute.enabled }, and what is the event? ${ triggerToExecute.event }`);
			if (triggerToExecute.enabled === true && triggerToExecute.event === event) {
				this.executeTrigger(triggerToExecute, argObject);
			}
		}
	}

	executeTrigger(trigger, argObject) {
		for (const url of trigger.urls) {
			this.executeTriggerUrl(url, trigger, argObject, 0);
		}
	}

	executeTriggerUrl(url, trigger, { event, message, room, owner, user }, theHistoryId, tries = 0) {
		logger.outgoing.debug(`Starting to execute trigger: ${ trigger.name } (${ trigger._id })`);

		let word;
		//Not all triggers/events support triggerWords
		if (RocketChat.integrations.outgoingEvents[event].use.triggerWords) {
			if (trigger.triggerWords && trigger.triggerWords.length > 0) {
				for (const triggerWord of trigger.triggerWords) {
					if (!trigger.triggerWordAnywhere && message.msg.indexOf(triggerWord) === 0) {
						word = triggerWord;
						break;
					} else if (trigger.triggerWordAnywhere && message.msg.includes(triggerWord)) {
						word = triggerWord;
						break;
					}
				}

				// Stop if there are triggerWords but none match
				if (!word) {
					logger.outgoing.debug(`The trigger word which "${ trigger.name }" was expecting could not be found, not executing.`);
					return;
				}
			}
		}

		const historyId = this.updateHistory({ step: 'start-execute-trigger-url', integration: trigger, event });

		const data = {
			token: trigger.token,
			bot: false
		};

		if (word) {
			data.trigger_word = word;
		}

		this.mapEventArgsToData(data, { trigger, event, message, room, owner, user });
		this.updateHistory({ historyId, step: 'mapped-args-to-data', data, triggerWord: word });

		logger.outgoing.info(`Will be executing the Integration "${ trigger.name }" to the url: ${ url }`);
		logger.outgoing.debug(data);

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
			opts = this.executeScript(trigger, 'prepare_outgoing_request', { request: opts }, historyId);
		}

		this.updateHistory({ historyId, step: 'after-maybe-ran-prepare', ranPrepareScript: true });

		if (!opts) {
			this.updateHistory({ historyId, step: 'after-prepare-no-opts', finished: true });
			return;
		}

		if (opts.message) {
			const prepareMessage = this.sendMessage({ trigger, room, message: opts.message, data });
			this.updateHistory({ historyId, step: 'after-prepare-send-message', prepareSentMessage: prepareMessage });
		}

		if (!opts.url || !opts.method) {
			this.updateHistory({ historyId, step: 'after-prepare-no-url_or_method', finished: true });
			return;
		}

		this.updateHistory({ historyId, step: 'pre-http-call', url: opts.url, httpCallData: opts.data });
		HTTP.call(opts.method, opts.url, opts, (error, result) => {
			if (!result) {
				logger.outgoing.warn(`Result for the Integration ${ trigger.name } to ${ url } is empty`);
			} else {
				logger.outgoing.info(`Status code for the Integration ${ trigger.name } to ${ url } is ${ result.statusCode }`);
			}

			this.updateHistory({ historyId, step: 'after-http-call', httpError: error, httpResult: result });

			if (this.hasScriptAndMethod(trigger, 'process_outgoing_response')) {
				const sandbox = {
					request: opts,
					response: {
						error,
						status_code: result ? result.statusCode : undefined, //These values will be undefined to close issues #4175, #5762, and #5896
						content: result ? result.data : undefined,
						content_raw: result ? result.content : undefined,
						headers: result ? result.headers : {}
					}
				};

				const scriptResult = this.executeScript(trigger, 'process_outgoing_response', sandbox, historyId);

				if (scriptResult && scriptResult.content) {
					const resultMessage = this.sendMessage({ trigger, room, message: scriptResult.content, data });
					this.updateHistory({ historyId, step: 'after-process-send-message', processSentMessage: resultMessage, finished: true });
					return;
				}

				if (scriptResult === false) {
					this.updateHistory({ historyId, step: 'after-process-false-result', finished: true });
					return;
				}
			}

			// if the result contained nothing or wasn't a successful statusCode
			if (!result || !this.successResults.includes(result.statusCode)) {
				if (error) {
					logger.outgoing.error(`Error for the Integration "${ trigger.name }" to ${ url } is:`);
					logger.outgoing.error(error);
				}

				if (result) {
					logger.outgoing.error(`Error for the Integration "${ trigger.name }" to ${ url } is:`);
					logger.outgoing.error(result);

					if (result.statusCode === 410) {
						this.updateHistory({ historyId, step: 'after-process-http-status-410', error: true });
						logger.outgoing.error(`Disabling the Integration "${ trigger.name }" because the status code was 401 (Gone).`);
						RocketChat.models.Integrations.update({ _id: trigger._id }, { $set: { enabled: false }});
						return;
					}

					if (result.statusCode === 500) {
						this.updateHistory({ historyId, step: 'after-process-http-status-500', error: true });
						logger.outgoing.error(`Error "500" for the Integration "${ trigger.name }" to ${ url }.`);
						logger.outgoing.error(result.content);
						return;
					}
				}

				if (trigger.retryFailedCalls) {
					if (tries < trigger.retryCount && trigger.retryDelay) {
						this.updateHistory({ historyId, error: true, step: `going-to-retry-${ tries + 1 }` });

						let waitTime;

						switch (trigger.retryDelay) {
							case 'powers-of-ten':
								// Try again in 0.1s, 1s, 10s, 1m40s, 16m40s, 2h46m40s, 27h46m40s, etc
								waitTime = Math.pow(10, tries + 2);
								break;
							case 'powers-of-two':
								// 2 seconds, 4 seconds, 8 seconds
								waitTime = Math.pow(2, tries + 1) * 1000;
								break;
							case 'increments-of-two':
								// 2 second, 4 seconds, 6 seconds, etc
								waitTime = (tries + 1) * 2 * 1000;
								break;
							default:
								const er = new Error('The integration\'s retryDelay setting is invalid.');
								this.updateHistory({ historyId, step: 'failed-and-retry-delay-is-invalid', error: true, errorStack: er.stack });
								return;
						}

						logger.outgoing.info(`Trying the Integration ${ trigger.name } to ${ url } again in ${ waitTime } milliseconds.`);
						Meteor.setTimeout(() => {
							this.executeTriggerUrl(url, trigger, { event, message, room, owner, user }, historyId, tries + 1);
						}, waitTime);
					} else {
						this.updateHistory({ historyId, step: 'too-many-retries', error: true });
					}
				} else {
					this.updateHistory({ historyId, step: 'failed-and-not-configured-to-retry', error: true });
				}

				return;
			}

			//process outgoing webhook response as a new message
			if (result && this.successResults.includes(result.statusCode)) {
				if (result && result.data && (result.data.text || result.data.attachments)) {
					const resultMsg = this.sendMessage({ trigger, room, message: result.data, data });
					this.updateHistory({ historyId, step: 'url-response-sent-message', resultMessage: resultMsg, finished: true });
				}
			}
		});
	}

	replay(integration, history) {
		if (!integration || integration.type !== 'webhook-outgoing') {
			throw new Meteor.Error('integration-type-must-be-outgoing', 'The integration type to replay must be an outgoing webhook.');
		}

		if (!history || !history.data) {
			throw new Meteor.Error('history-data-must-be-defined', 'The history data must be defined to replay an integration.');
		}

		const event = history.event;
		const message = RocketChat.models.Messages.findOneById(history.data.message_id);
		const room = RocketChat.models.Rooms.findOneById(history.data.channel_id);
		const user = RocketChat.models.Users.findOneById(history.data.user_id);
		let owner;

		if (history.data.owner && history.data.owner._id) {
			owner = RocketChat.models.Users.findOneById(history.data.owner._id);
		}

		this.executeTriggerUrl(history.url, integration, { event, message, room, owner, user });
	}
};
