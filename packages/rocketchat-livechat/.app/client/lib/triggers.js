/* globals Livechat */
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';

import visitor from '../../imports/client/visitor';

const firedTriggers = JSON.parse(localStorage.getItem('rocketChatFiredTriggers')) || [];

// promise cache for multiple calls (let's say multiple triggers running before the previous finished)
const agentCacheExpiry = 3600000;
let agentPromise;
function getAgent(triggerAction) {
	if (agentPromise) {
		return agentPromise;
	}
	agentPromise = new Promise((resolve, reject) => {
		const { params } = triggerAction;
		if (params.sender === 'queue') {
			const cache = localStorage.getItem('triggerAgent');
			if (cache) {
				const cacheAgent = JSON.parse(cache);

				// cache valid for 1h
				if (cacheAgent.ts && Date.now() - cacheAgent.ts < agentCacheExpiry) {
					return resolve(cacheAgent.agent);
				}
			}

			Meteor.call('livechat:getNextAgent', {
				token: visitor.getToken(),
				department: Livechat.department,
			}, (error, result) => {
				if (error) {
					return reject(error);
				}
				localStorage.setItem('triggerAgent', JSON.stringify({
					agent: result,
					ts: Date.now(),
				}));

				resolve(result);
			});
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
}

this.Triggers = (function() {
	let triggers = [];
	let initiated = false;
	let requests = [];
	let enabled = true;

	const fire = function(trigger) {
		if (!enabled || visitor.getId()) {
			return;
		}
		trigger.actions.forEach(function(action) {
			if (action.name === 'send-message') {
				// flag to skip the trigger if the action is 'send-message'
				trigger.skip = true;

				getAgent(action).then((agent) => {
					let roomId = visitor.getRoom();

					if (!roomId) {
						roomId = Random.id();
						visitor.setRoom(roomId);
					}

					Session.set('triggered', true);
					ChatMessage.insert({
						msg: action.params.msg,
						rid: roomId,
						u: agent,
					});

					if (agent._id) {
						Livechat.agent = agent;
					}

					parentCall('openWidget');
				});
			}
		});

		if (trigger.runOnce) {
			trigger.skip = true;
			firedTriggers.push(trigger._id);
			localStorage.setItem('rocketChatFiredTriggers', JSON.stringify(firedTriggers));
		}
	};

	const processRequest = function(request) {
		if (!initiated) {
			return requests.push(request);
		}
		triggers.forEach(function(trigger) {
			if (trigger.skip) {
				return;
			}
			trigger.conditions.forEach(function(condition) {
				switch (condition.name) {
					case 'page-url':
						if (request.location.href.match(new RegExp(condition.value))) {
							fire(trigger);
						}
						break;

					case 'time-on-site':
						if (trigger.timeout) {
							clearTimeout(trigger.timeout);
						}
						trigger.timeout = setTimeout(function() {
							fire(trigger);
						}, parseInt(condition.value) * 1000);
						break;
				}
			});
		});
	};

	const setTriggers = function(newTriggers) {
		triggers = newTriggers;
	};

	const init = function(newTriggers) {
		if (initiated) {
			return;
		}

		initiated = true;

		if (newTriggers) {
			setTriggers(newTriggers);
		}

		firedTriggers.forEach((triggerId) => {
			triggers.forEach((trigger) => {
				if (trigger._id === triggerId) {
					trigger.skip = true;
				}
			});
		});

		if (requests.length > 0 && triggers.length > 0) {
			requests.forEach(function(request) {
				processRequest(request);
			});

			requests = [];
		}
	};

	const setDisabled = function() {
		enabled = false;
	};

	const setEnabled = function() {
		enabled = true;
	};

	return {
		init,
		processRequest,
		setTriggers,
		setDisabled,
		setEnabled,
	};
}());
