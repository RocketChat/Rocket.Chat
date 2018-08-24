/* globals Livechat */
import visitor from '../../imports/client/visitor';

function getAgent(triggerAction) {
	return new Promise((resolve, reject) => {
		const { params } = triggerAction;
		if (params.sender === 'queue') {
			const cache = localStorage.getItem('triggerAgent');
			if (cache) {
				const cacheAgent = JSON.parse(cache);

				// cache valid for 1h
				if (cacheAgent.ts && Date.now() - cacheAgent.ts < 3600000) {
					return resolve(cacheAgent.agent);
				}
			}

			Meteor.call('livechat:getNextAgent', {
				token: visitor.getToken(),
				department: Livechat.department
			}, (error, result) => {
				if (error) {
					return reject(error);
				}
				localStorage.setItem('triggerAgent', JSON.stringify({
					agent: result,
					ts: Date.now()
				}));

				resolve(result);
			});
		} else if (params.sender === 'custom') {
			resolve({
				username: params.name
			});
		} else {
			reject('Unknown sender');
		}
	});
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
						u: agent
					});

					if (agent._id) {
						Livechat.agent = agent;
					}

					parentCall('openWidget');
				});
			}
		});
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

	const init = function() {
		initiated = true;

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
		setEnabled
	};
}());
