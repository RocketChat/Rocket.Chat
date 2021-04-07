import vm from 'vm';

import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import Fiber from 'fibers';
import Future from 'fibers/future';

import * as Models from '../../../models';
import { settings } from '../../../settings';
import { logger } from '../logger';
import { integrations } from '../../lib/rocketchat';
import EventArgumentHandler from './eventArgumentHandler';
import UpdateHistoryWebhook from './updateHistoryWebhook';
import SendMessageWebhook from './sendMessageWebhook';

integrations.triggerHandler = new class RocketChatIntegrationHandler {
	constructor() {
		this.vm = vm;
		this.successResults = [200, 201, 202];
		this.compiledScripts = {};
		this.triggers = {};
		this.updateHistory = UpdateHistoryWebhook.updateHistory;
		this.sendMessage = SendMessageWebhook.sendMessage;

		Models.Integrations.find({ type: 'webhook-outgoing' }).fetch().forEach((data) => this.addIntegration(data));
	}

	addIntegration(record) {
		logger.outgoing.debug(`Adding the integration ${ record.name } of the event ${ record.event }!`);
		let channels;
		if (record.event && !integrations.outgoingEvents[record.event].use.channel) {
			logger.outgoing.debug('The integration doesnt rely on channels.');
			// We don't use any channels, so it's special ;)
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

	isTriggerEnabled(trigger) {
		for (const trig of Object.values(this.triggers)) {
			if (trig[trigger._id]) {
				return trig[trigger._id].enabled;
			}
		}

		return false;
	}

	buildSandbox(store = {}) {
		const sandbox = {
			scriptTimeout(reject) {
				return setTimeout(() => reject('timed out'), 3000);
			},
			_,
			s,
			console,
			moment,
			Fiber,
			Promise,
			Store: {
				set: (key, val) => { store[key] = val; },
				get: (key) => store[key],
			},
			HTTP: (method, url, options) => {
				try {
					return {
						result: HTTP.call(method, url, options),
					};
				} catch (error) {
					return { error };
				}
			},
		};

		Object.keys(Models).filter((k) => !k.startsWith('_')).forEach((k) => {
			sandbox[k] = Models[k];
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
					_updatedAt: integration._updatedAt,
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

			const result = Future.fromPromise(this.vm.runInNewContext(`
				new Promise((resolve, reject) => {
					Fiber(() => {
						scriptTimeout(reject);
						try {
							resolve(script[method](params))
						} catch(e) {
							reject(e);
						}
					}).run();
				}).catch((error) => { throw new Error(error); });
			`, sandbox, {
				timeout: 3000,
			})).wait();

			logger.outgoing.debug(`Script method "${ method }" result of the Integration "${ integration.name }" is:`);
			logger.outgoing.debug(result);

			return result;
		} catch (e) {
			this.updateHistory({ historyId, step: `execute-script-error-running-${ method }`, error: true, errorStack: e.stack.replace(/^/gm, '  ') });
			logger.outgoing.error(`Error running Script in the Integration ${ integration.name }:`);
			logger.outgoing.debug(integration.scriptCompiled.replace(/^/gm, '  ')); // Only output the compiled script if debugging is enabled, so the logs don't get spammed.
			logger.outgoing.error('Stack:');
			logger.outgoing.error(e.stack.replace(/^/gm, '  '));
		}
	}

	getTriggersToExecute(room, message) {
		const triggersToExecute = new Set();
		if (room) {
			switch (room.t) {
				case 'd':
					if (this.triggers.all_direct_messages) {
						for (const trigger of Object.values(this.triggers.all_direct_messages)) {
							triggersToExecute.add(trigger);
						}
					}

					room.uids.filter((uid) => this.triggers[`@${ uid }`]).forEach((uid) => {
						for (const trigger of Object.values(this.triggers[`@${ uid }`])) {
							triggersToExecute.add(trigger);
						}
					});

					room.usernames.filter((username) => username !== message.u.username && this.triggers[`@${ username }`]).forEach((username) => {
						for (const trigger of Object.values(this.triggers[`@${ username }`])) {
							triggersToExecute.add(trigger);
						}
					});
					break;
				case 'c':
					if (this.triggers.all_public_channels) {
						for (const trigger of Object.values(this.triggers.all_public_channels)) {
							triggersToExecute.add(trigger);
						}
					}

					if (this.triggers[`#${ room._id }`]) {
						for (const trigger of Object.values(this.triggers[`#${ room._id }`])) {
							triggersToExecute.add(trigger);
						}
					}

					if (room._id !== room.name && this.triggers[`#${ room.name }`]) {
						for (const trigger of Object.values(this.triggers[`#${ room.name }`])) {
							triggersToExecute.add(trigger);
						}
					}
					break;

				default:
					if (this.triggers.all_private_groups) {
						for (const trigger of Object.values(this.triggers.all_private_groups)) {
							triggersToExecute.add(trigger);
						}
					}

					if (this.triggers[`#${ room._id }`]) {
						for (const trigger of Object.values(this.triggers[`#${ room._id }`])) {
							triggersToExecute.add(trigger);
						}
					}

					if (room._id !== room.name && this.triggers[`#${ room.name }`]) {
						for (const trigger of Object.values(this.triggers[`#${ room.name }`])) {
							triggersToExecute.add(trigger);
						}
					}
					break;
			}
		}
		return [...triggersToExecute];
	}

	executeTriggers(...args) {
		logger.outgoing.debug('Execute Trigger:', args[0]);

		const argObject = EventArgumentHandler.eventNameArgumentsToObject(...args);
		const { event, message, room } = argObject;

		// Each type of event should have an event and a room attached, otherwise we
		// wouldn't know how to handle the trigger nor would we have anywhere to send the
		// result of the integration
		if (!event) {
			return;
		}

		logger.outgoing.debug('Starting search for triggers for the room:', room ? room._id : '__any');

		const triggersToExecute = this.getTriggersToExecute(room, message);

		if (this.triggers.__any) {
			// For outgoing integration which don't rely on rooms.
			for (const trigger of Object.values(this.triggers.__any)) {
				triggersToExecute.push(trigger);
			}
		}

		logger.outgoing.debug(`Found ${ triggersToExecute.length } to iterate over and see if the match the event.`);

		for (const triggerToExecute of triggersToExecute) {
			logger.outgoing.debug(`Is "${ triggerToExecute.name }" enabled, ${ triggerToExecute.enabled }, and what is the event? ${ triggerToExecute.event }`);
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
		if (!this.isTriggerEnabled(trigger)) {
			logger.outgoing.warn(`The trigger "${ trigger.name }" is no longer enabled, stopping execution of it at try: ${ tries }`);
			return;
		}

		logger.outgoing.debug(`Starting to execute trigger: ${ trigger.name } (${ trigger._id })`);

		let word;
		// Not all triggers/events support triggerWords
		if (integrations.outgoingEvents[event].use.triggerWords) {
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

		if (message && message.editedAt && !trigger.runOnEdits) {
			logger.outgoing.debug(`The trigger "${ trigger.name }"'s run on edits is disabled and the message was edited.`);
			return;
		}

		const historyId = this.updateHistory({ step: 'start-execute-trigger-url', integration: trigger, event });

		const data = {
			token: trigger.token,
			bot: false,
		};

		if (word) {
			data.trigger_word = word;
		}

		EventArgumentHandler.mapEventArgsToData(data, { trigger, event, message, room, owner, user });
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
				rejectUnauthorized: !settings.get('Allow_Invalid_SelfSigned_Certs'),
				strictSSL: !settings.get('Allow_Invalid_SelfSigned_Certs'),
			},
			headers: {
				'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36',
			},
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
						status_code: result ? result.statusCode : undefined, // These values will be undefined to close issues #4175, #5762, and #5896
						content: result ? result.data : undefined,
						content_raw: result ? result.content : undefined,
						headers: result ? result.headers : {},
					},
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
						Models.Integrations.update({ _id: trigger._id }, { $set: { enabled: false } });
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

			// process outgoing webhook response as a new message
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

		const { event } = history;
		const message = Models.Messages.findOneById(history.data.message_id);
		const room = Models.Rooms.findOneById(history.data.channel_id);
		const user = Models.Users.findOneById(history.data.user_id);
		let owner;

		if (history.data.owner && history.data.owner._id) {
			owner = Models.Users.findOneById(history.data.owner._id);
		}

		this.executeTriggerUrl(history.url, integration, { event, message, room, owner, user });
	}
}();

export { integrations };
