import mitt from 'mitt';
import { route } from 'preact-router';

import { Livechat } from '../api';
import { asyncForEach } from '../helpers/asyncForEach';
import { upsert } from '../helpers/upsert';
import store from '../store';
import { normalizeAgent } from './api';
import { processUnread } from './main';
import { parentCall } from './parentCall';
import { createToken } from './random';

const agentCacheExpiry = 3600000;
let agentPromise;
const getAgent = (triggerAction) => {
	if (agentPromise) {
		return agentPromise;
	}

	agentPromise = new Promise(async (resolve, reject) => {
		const { params } = triggerAction;

		if (params.sender === 'queue') {
			const { state } = store;
			const {
				defaultAgent,
				iframe: {
					guest: { department },
				},
			} = state;
			if (defaultAgent && defaultAgent.ts && Date.now() - defaultAgent.ts < agentCacheExpiry) {
				return resolve(defaultAgent); // cache valid for 1
			}

			let agent;
			try {
				agent = await Livechat.nextAgent(department);
			} catch (error) {
				return reject(error);
			}

			store.setState({ defaultAgent: { ...agent, department, ts: Date.now() } });
			resolve(agent);
		} else if (params.sender === 'custom') {
			resolve({
				username: params.name,
			});
		} else {
			reject('Unknown sender');
		}
	});

	// expire the promise cache as well
	setTimeout(() => {
		agentPromise = null;
	}, agentCacheExpiry);

	return agentPromise;
};

const isInIframe = () => window.self !== window.top;

class Triggers {
	/** @property {Triggers} instance*/

	/** @property {boolean} _started */

	/** @property {Array} _requests */

	/** @property {Array} _triggers */

	/** @property {boolean} _enabled */

	/** @property {import('mitt').Emitter} callbacks */

	constructor() {
		if (!Triggers.instance) {
			this._started = false;
			this._requests = [];
			this._triggers = [];
			this._enabled = true;
			Triggers.instance = this;
			this.callbacks = mitt();
		}

		return Triggers.instance;
	}

	init() {
		if (this._started) {
			return;
		}

		const {
			token,
			firedTriggers = [],
			config: { triggers },
		} = store.state;
		Livechat.credentials.token = token;

		if (!(triggers && triggers.length > 0)) {
			return;
		}

		this._started = true;
		this._triggers = [...triggers];

		firedTriggers.forEach((id) => {
			this._triggers.forEach((trigger) => {
				if (trigger._id === id) {
					trigger.skip = true;
				}
			});
		});

		store.on('change', ([state, prevState]) => {
			if (prevState.parentUrl !== state.parentUrl) {
				this.processPageUrlTriggers();
			}
		});
	}

	async fire(trigger) {
		const { token, firedTriggers = [], user } = store.state;

		if (!this._enabled || user) {
			return;
		}

		const { actions, conditions } = trigger;
		await asyncForEach(actions, (action) => {
			if (action.name === 'send-message') {
				trigger.skip = true;

				getAgent(action).then(async (agent) => {
					const ts = new Date();

					const message = {
						msg: action.params.msg,
						token,
						u: agent,
						ts: ts.toISOString(),
						_id: createToken(),
						trigger: true,
						triggerAfterRegistration: conditions.some((c) => c.name === 'after-guest-registration'),
					};

					await store.setState({
						triggered: true,
						messages: upsert(
							store.state.messages,
							message,
							({ _id }) => _id === message._id,
							({ ts }) => ts,
						),
					});

					await processUnread();

					if (agent && agent._id) {
						await store.setState({ agent });
						parentCall('callback', ['assign-agent', normalizeAgent(agent)]);
					}

					const foundCondition = trigger.conditions.find((c) => ['chat-opened-by-visitor', 'after-guest-registration'].includes(c.name));
					if (!foundCondition) {
						route('/trigger-messages');
					}

					store.setState({ minimized: false });
				});
			}
		});

		if (trigger.runOnce) {
			trigger.skip = true;
			store.setState({ firedTriggers: [...firedTriggers, trigger._id] });
		}
	}

	processRequest(request) {
		this._requests.push(request);
	}

	ready(triggerId, condition) {
		const { activeTriggers = [] } = store.state;
		store.setState({ activeTriggers: { ...activeTriggers, [triggerId]: condition } });
	}

	showTriggerMessages() {
		const { activeTriggers = [] } = store.state;

		const triggers = Object.entries(activeTriggers);

		if (!triggers.length) {
			return false;
		}

		return triggers.some(([, condition]) => condition.name !== 'after-guest-registration');
	}

	processTriggers() {
		this._triggers.forEach((trigger) => {
			if (trigger.skip) {
				return;
			}

			trigger.conditions.forEach((condition) => {
				switch (condition.name) {
					case 'page-url':
						const hrefRegExp = new RegExp(condition.value, 'g');
						if (this.parentUrl && hrefRegExp.test(this.parentUrl)) {
							this.ready(trigger._id, condition);
							this.fire(trigger);
						}
						break;
					case 'time-on-site':
						this.ready(trigger._id, condition);
						trigger.timeout = setTimeout(() => {
							this.fire(trigger);
						}, parseInt(condition.value, 10) * 1000);
						break;
					case 'chat-opened-by-visitor':
					case 'after-guest-registration':
						const openFunc = () => {
							this.fire(trigger);
							this.callbacks.off('chat-opened-by-visitor', openFunc);
						};
						this.ready(trigger._id, condition);
						this.callbacks.on('chat-opened-by-visitor', openFunc);
						break;
				}
			});
		});
		this._requests = [];
	}

	processPageUrlTriggers() {
		if (!this.parentUrl) return;

		this._triggers.forEach((trigger) => {
			if (trigger.skip) return;

			trigger.conditions.forEach((condition) => {
				if (condition.name !== 'page-url') return;

				const hrefRegExp = new RegExp(condition.value, 'g');
				if (hrefRegExp.test(this.parentUrl)) {
					this.fire(trigger);
				}
			});
		});
	}

	set triggers(newTriggers) {
		this._triggers = [...newTriggers];
	}

	set enabled(value) {
		this._enabled = value;
	}

	get parentUrl() {
		return isInIframe() ? store.state.parentUrl : window.location.href;
	}
}

const instance = new Triggers();
export default instance;
