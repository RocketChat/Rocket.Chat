import { VM, VMScript } from 'vm2';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { HTTP } from 'meteor/http';
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';
import Fiber from 'fibers';
import Future from 'fibers/future';
import { Integrations, IntegrationHistory } from '@rocket.chat/models';

import * as Models from '../../../models/server';
import { settings } from '../../../settings/server';
import { getRoomByNameOrIdWithOptionToJoin, processWebhookMessage } from '../../../lib/server';
import { outgoingLogger } from '../logger';
import { outgoingEvents } from '../../lib/outgoingEvents';
import { fetch } from '../../../../server/lib/http/fetch';
import { omit } from '../../../../lib/utils/omit';

export class RocketChatIntegrationHandler {
	constructor() {
		this.successResults = [200, 201, 202];
		this.compiledScripts = {};
		this.triggers = {};

		Promise.await(Integrations.find({ type: 'webhook-outgoing' }).forEach((data) => this.addIntegration(data)));
	}

	addIntegration(record) {
		outgoingLogger.debug(`Adding the integration ${record.name} of the event ${record.event}!`);
		let channels;
		if (record.event && !outgoingEvents[record.event].use.channel) {
			outgoingLogger.debug('The integration doesnt rely on channels.');
			// We don't use any channels, so it's special ;)
			channels = ['__any'];
		} else if (_.isEmpty(record.channel)) {
			outgoingLogger.debug('The integration had an empty channel property, so it is going on all the public channels.');
			channels = ['all_public_channels'];
		} else {
			outgoingLogger.debug('The integration is going on these channels:', record.channel);
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

	updateHistory({
		historyId,
		step,
		integration,
		event,
		data,
		triggerWord,
		ranPrepareScript,
		prepareSentMessage,
		processSentMessage,
		resultMessage,
		finished,
		url,
		httpCallData,
		httpError,
		httpResult,
		error,
		errorStack,
	}) {
		const history = {
			type: 'outgoing-webhook',
			step,
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
			history.data = { ...data };

			if (data.user) {
				history.data.user = omit(data.user, 'services');
			}

			if (data.room) {
				history.data.room = data.room;
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
			history.httpResult = JSON.stringify(httpResult, null, 2);
		}

		if (typeof error !== 'undefined') {
			history.error = error;
		}

		if (typeof errorStack !== 'undefined') {
			history.errorStack = errorStack;
		}

		if (historyId) {
			Promise.await(IntegrationHistory.updateOne({ _id: historyId }, { $set: history }));
			return historyId;
		}

		history._createdAt = new Date();

		const _id = Random.id();

		Promise.await(IntegrationHistory.insertOne({ _id, ...history }));

		return _id;
	}

	// Trigger is the trigger, nameOrId is a string which is used to try and find a room, room is a room, message is a message, and data contains "user_name" if trigger.impersonateUser is truthful.
	sendMessage({ trigger, nameOrId = '', room, message, data }) {
		let user;
		// Try to find the user who we are impersonating
		if (trigger.impersonateUser) {
			user = Models.Users.findOneByUsernameIgnoringCase(data.user_name);
		}

		// If they don't exist (aka the trigger didn't contain a user) then we set the user based upon the
		// configured username for the integration since this is required at all times.
		if (!user) {
			user = Models.Users.findOneByUsernameIgnoringCase(trigger.username);
		}

		let tmpRoom;
		if (nameOrId || trigger.targetRoom || message.channel) {
			tmpRoom =
				getRoomByNameOrIdWithOptionToJoin({
					currentUserId: user._id,
					nameOrId: nameOrId || message.channel || trigger.targetRoom,
					errorOnEmpty: false,
				}) || room;
		} else {
			tmpRoom = room;
		}

		// If no room could be found, we won't be sending any messages but we'll warn in the logs
		if (!tmpRoom) {
			outgoingLogger.warn(
				`The Integration "${trigger.name}" doesn't have a room configured nor did it provide a room to send the message to.`,
			);
			return;
		}

		outgoingLogger.debug(`Found a room for ${trigger.name} which is: ${tmpRoom.name} with a type of ${tmpRoom.t}`);

		message.bot = { i: trigger._id };

		const defaultValues = {
			alias: trigger.alias,
			avatar: trigger.avatar,
			emoji: trigger.emoji,
		};

		if (tmpRoom.t === 'd') {
			message.channel = `@${tmpRoom._id}`;
		} else {
			message.channel = `#${tmpRoom._id}`;
		}

		message = processWebhookMessage(message, user, defaultValues);
		return message;
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
				set: (key, val) => {
					store[key] = val;
				},
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

		Object.keys(Models)
			.filter((k) => !k.startsWith('_'))
			.forEach((k) => {
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

		try {
			outgoingLogger.info({ msg: 'Will evaluate script of Trigger', integration: integration.name });
			outgoingLogger.debug(script);

			const vmScript = new VMScript(`${script}; Script;`, 'script.js');
			const vm = new VM({
				sandbox,
			});

			const ScriptClass = vm.run(vmScript);

			if (ScriptClass) {
				this.compiledScripts[integration._id] = {
					script: new ScriptClass(),
					store,
					_updatedAt: integration._updatedAt,
				};

				return this.compiledScripts[integration._id].script;
			}
		} catch (err) {
			outgoingLogger.error({
				msg: 'Error evaluating Script in Trigger',
				integration: integration.name,
				script,
				err,
			});
			throw new Meteor.Error('error-evaluating-script');
		}

		outgoingLogger.error(`Class "Script" not in Trigger ${integration.name}:`);
		throw new Meteor.Error('class-script-not-found');
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
			this.updateHistory({
				historyId,
				step: 'execute-script-getting-script',
				error: true,
				errorStack: e,
			});
			return;
		}

		if (!script[method]) {
			outgoingLogger.error(`Method "${method}" no found in the Integration "${integration.name}"`);
			this.updateHistory({ historyId, step: `execute-script-no-method-${method}` });
			return;
		}

		try {
			const { sandbox } = this.buildSandbox(this.compiledScripts[integration._id].store);
			sandbox.script = script;
			sandbox.method = method;
			sandbox.params = params;

			this.updateHistory({ historyId, step: `execute-script-before-running-${method}` });

			const vm = new VM({
				timeout: 3000,
				sandbox,
			});

			const scriptResult = vm.run(`
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
			`);

			const result = Future.fromPromise(scriptResult).wait();

			outgoingLogger.debug({
				msg: `Script method "${method}" result of the Integration "${integration.name}" is:`,
				result,
			});

			return result;
		} catch (err) {
			this.updateHistory({
				historyId,
				step: `execute-script-error-running-${method}`,
				error: true,
				errorStack: err.stack.replace(/^/gm, '  '),
			});
			outgoingLogger.error({
				msg: 'Error running Script in the Integration',
				integration: integration.name,
				err,
			});
			outgoingLogger.debug({
				msg: 'Error running Script in the Integration',
				integration: integration.name,
				script: integration.scriptCompiled,
			}); // Only output the compiled script if debugging is enabled, so the logs don't get spammed.
		}
	}

	eventNameArgumentsToObject(...args) {
		const argObject = {
			event: args[0],
		};

		switch (argObject.event) {
			case 'sendMessage':
				if (args.length >= 3) {
					argObject.message = args[1];
					argObject.room = args[2];
				}
				break;
			case 'fileUploaded':
				if (args.length >= 2) {
					const arghhh = args[1];
					argObject.user = arghhh.user;
					argObject.room = arghhh.room;
					argObject.message = arghhh.message;
				}
				break;
			case 'roomArchived':
				if (args.length >= 3) {
					argObject.room = args[1];
					argObject.user = args[2];
				}
				break;
			case 'roomCreated':
				if (args.length >= 3) {
					argObject.owner = args[1];
					argObject.room = args[2];
				}
				break;
			case 'roomJoined':
			case 'roomLeft':
				if (args.length >= 3) {
					argObject.user = args[1];
					argObject.room = args[2];
				}
				break;
			case 'userCreated':
				if (args.length >= 2) {
					argObject.user = args[1];
				}
				break;
			default:
				outgoingLogger.warn(`An Unhandled Trigger Event was called: ${argObject.event}`);
				argObject.event = undefined;
				break;
		}

		outgoingLogger.debug({
			msg: `Got the event arguments for the event: ${argObject.event}`,
			argObject,
		});

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
				data.siteUrl = settings.get('Site_Url');

				if (message.alias) {
					data.alias = message.alias;
				}

				if (message.bot) {
					data.bot = message.bot;
				}

				if (message.editedAt) {
					data.isEdited = true;
				}

				if (message.tmid) {
					data.tmid = message.tmid;
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

					room.uids
						.filter((uid) => this.triggers[`@${uid}`])
						.forEach((uid) => {
							for (const trigger of Object.values(this.triggers[`@${uid}`])) {
								triggersToExecute.add(trigger);
							}
						});

					room.usernames
						.filter((username) => username !== message?.u?.username && this.triggers[`@${username}`])
						.forEach((username) => {
							for (const trigger of Object.values(this.triggers[`@${username}`])) {
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

					if (this.triggers[`#${room._id}`]) {
						for (const trigger of Object.values(this.triggers[`#${room._id}`])) {
							triggersToExecute.add(trigger);
						}
					}

					if (room._id !== room.name && this.triggers[`#${room.name}`]) {
						for (const trigger of Object.values(this.triggers[`#${room.name}`])) {
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

					if (this.triggers[`#${room._id}`]) {
						for (const trigger of Object.values(this.triggers[`#${room._id}`])) {
							triggersToExecute.add(trigger);
						}
					}

					if (room._id !== room.name && this.triggers[`#${room.name}`]) {
						for (const trigger of Object.values(this.triggers[`#${room.name}`])) {
							triggersToExecute.add(trigger);
						}
					}
					break;
			}
		}
		return [...triggersToExecute];
	}

	executeTriggers(...args) {
		outgoingLogger.debug({ msg: 'Execute Trigger:', arg: args[0] });

		const argObject = this.eventNameArgumentsToObject(...args);
		const { event, message, room } = argObject;

		// Each type of event should have an event and a room attached, otherwise we
		// wouldn't know how to handle the trigger nor would we have anywhere to send the
		// result of the integration
		if (!event) {
			return;
		}

		outgoingLogger.debug(`Starting search for triggers for the room: ${room ? room._id : '__any'}`);

		const triggersToExecute = this.getTriggersToExecute(room, message);

		if (this.triggers.__any) {
			// For outgoing integration which don't rely on rooms.
			for (const trigger of Object.values(this.triggers.__any)) {
				triggersToExecute.push(trigger);
			}
		}

		outgoingLogger.debug(`Found ${triggersToExecute.length} to iterate over and see if the match the event.`);

		for (const triggerToExecute of triggersToExecute) {
			outgoingLogger.debug(
				`Is "${triggerToExecute.name}" enabled, ${triggerToExecute.enabled}, and what is the event? ${triggerToExecute.event}`,
			);
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
			outgoingLogger.warn(`The trigger "${trigger.name}" is no longer enabled, stopping execution of it at try: ${tries}`);
			return;
		}

		outgoingLogger.debug(`Starting to execute trigger: ${trigger.name} (${trigger._id})`);

		let word;
		// Not all triggers/events support triggerWords
		if (outgoingEvents[event].use.triggerWords) {
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
					outgoingLogger.debug(`The trigger word which "${trigger.name}" was expecting could not be found, not executing.`);
					return;
				}
			}
		}

		if (message && message.editedAt && !trigger.runOnEdits) {
			outgoingLogger.debug(`The trigger "${trigger.name}"'s run on edits is disabled and the message was edited.`);
			return;
		}

		const historyId = this.updateHistory({
			step: 'start-execute-trigger-url',
			integration: trigger,
			event,
		});

		const data = {
			token: trigger.token,
			bot: false,
		};

		if (word) {
			data.trigger_word = word;
		}

		this.mapEventArgsToData(data, { trigger, event, message, room, owner, user });
		this.updateHistory({ historyId, step: 'mapped-args-to-data', data, triggerWord: word });

		outgoingLogger.info(`Will be executing the Integration "${trigger.name}" to the url: ${url}`);
		outgoingLogger.debug({ data });

		let opts = {
			params: {},
			method: 'POST',
			url,
			data,
			auth: undefined,
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
			this.updateHistory({
				historyId,
				step: 'after-prepare-send-message',
				prepareSentMessage: prepareMessage,
			});
		}

		if (!opts.url || !opts.method) {
			this.updateHistory({ historyId, step: 'after-prepare-no-url_or_method', finished: true });
			return;
		}

		// based on HTTP.call implementation
		if (opts.auth) {
			if (opts.auth.indexOf(':') < 0) {
				throw new Error('auth option should be of the form "username:password"');
			}

			const base64 = Buffer.from(opts.auth, 'ascii').toString('base64');
			opts.headers.Authorization = `Basic ${base64}`;
		}

		this.updateHistory({
			historyId,
			step: 'pre-http-call',
			url: opts.url,
			httpCallData: opts.data,
		});

		if (opts.data) {
			opts.headers['Content-Type'] = 'application/json';
		}

		fetch(
			opts.url,
			{
				method: opts.method,
				headers: opts.headers,
				...(opts.data && { body: JSON.stringify(opts.data) }),
			},
			settings.get('Allow_Invalid_SelfSigned_Certs'),
		)
			.then(async (res) => {
				const content = await res.text();
				if (!content) {
					outgoingLogger.warn(`Result for the Integration ${trigger.name} to ${url} is empty`);
				} else {
					outgoingLogger.info(`Status code for the Integration ${trigger.name} to ${url} is ${res.status}`);
				}

				const data = (() => {
					const contentType = (res.headers.get('content-type') || '').split(';')[0];
					if (!['application/json', 'text/javascript', 'application/javascript', 'application/x-javascript'].includes(contentType)) {
						return null;
					}

					try {
						return JSON.parse(content);
					} catch (_error) {
						return null;
					}
				})();

				this.updateHistory({
					historyId,
					step: 'after-http-call',
					httpError: null,
					httpResult: content,
				});

				if (this.hasScriptAndMethod(trigger, 'process_outgoing_response')) {
					const sandbox = {
						request: opts,
						response: {
							error: null,
							status_code: res.status, // These values will be undefined to close issues #4175, #5762, and #5896
							content,
							content_raw: content,
							headers: Object.fromEntries(res.headers),
						},
					};

					const scriptResult = this.executeScript(trigger, 'process_outgoing_response', sandbox, historyId);

					if (scriptResult && scriptResult.content) {
						const resultMessage = this.sendMessage({
							trigger,
							room,
							message: scriptResult.content,
							data,
						});
						this.updateHistory({
							historyId,
							step: 'after-process-send-message',
							processSentMessage: resultMessage,
							finished: true,
						});
						return;
					}

					if (scriptResult === false) {
						this.updateHistory({ historyId, step: 'after-process-false-result', finished: true });
						return;
					}
				}

				// if the result contained nothing or wasn't a successful statusCode
				if (!content || !this.successResults.includes(res.status)) {
					if (content) {
						outgoingLogger.error({
							msg: `Error for the Integration "${trigger.name}" to ${url}`,
							result: content,
						});

						if (res.status === 410) {
							this.updateHistory({ historyId, step: 'after-process-http-status-410', error: true });
							outgoingLogger.error(`Disabling the Integration "${trigger.name}" because the status code was 401 (Gone).`);
							await Integrations.updateOne({ _id: trigger._id }, { $set: { enabled: false } });
							return;
						}

						if (res.status === 500) {
							this.updateHistory({ historyId, step: 'after-process-http-status-500', error: true });
							outgoingLogger.error({
								msg: `Error "500" for the Integration "${trigger.name}" to ${url}.`,
								content,
							});
							return;
						}
					}

					if (trigger.retryFailedCalls) {
						if (tries < trigger.retryCount && trigger.retryDelay) {
							this.updateHistory({ historyId, error: true, step: `going-to-retry-${tries + 1}` });

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
									const er = new Error("The integration's retryDelay setting is invalid.");
									this.updateHistory({
										historyId,
										step: 'failed-and-retry-delay-is-invalid',
										error: true,
										errorStack: er.stack,
									});
									return;
							}

							outgoingLogger.info(`Trying the Integration ${trigger.name} to ${url} again in ${waitTime} milliseconds.`);
							Meteor.setTimeout(() => {
								this.executeTriggerUrl(url, trigger, { event, message, room, owner, user }, historyId, tries + 1);
							}, waitTime);
						} else {
							this.updateHistory({ historyId, step: 'too-many-retries', error: true });
						}
					} else {
						this.updateHistory({
							historyId,
							step: 'failed-and-not-configured-to-retry',
							error: true,
						});
					}

					return;
				}

				// process outgoing webhook response as a new message
				if (content && this.successResults.includes(res.status)) {
					if (data?.text || data?.attachments) {
						const resultMsg = this.sendMessage({ trigger, room, message: data, data });
						this.updateHistory({
							historyId,
							step: 'url-response-sent-message',
							resultMessage: resultMsg,
							finished: true,
						});
					}
				}
			})
			.catch((error) => {
				outgoingLogger.error(error);
				this.updateHistory({
					historyId,
					step: 'after-http-call',
					httpError: error,
					httpResult: null,
				});
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
}
const triggerHandler = new RocketChatIntegrationHandler();
export { triggerHandler };
