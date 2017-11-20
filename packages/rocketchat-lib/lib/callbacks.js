import _ from 'underscore';

/*
* Callback hooks provide an easy way to add extra steps to common operations.
* @namespace RocketChat.callbacks
*/

RocketChat.callbacks = {};

if (Meteor.isServer) {
	RocketChat.callbacks.showTime = true;
	RocketChat.callbacks.showTotalTime = true;
} else {
	RocketChat.callbacks.showTime = false;
	RocketChat.callbacks.showTotalTime = false;
}


/*
* Callback priorities
*/

RocketChat.callbacks.priority = {
	HIGH: -1000,
	MEDIUM: 0,
	LOW: 1000
};


/*
* Add a callback function to a hook
* @param {String} hook - The name of the hook
* @param {Function} callback - The callback function
*/

RocketChat.callbacks.add = function(hook, callback, priority, id) {
	if (priority == null) {
		priority = RocketChat.callbacks.priority.MEDIUM;
	}
	if (!_.isNumber(priority)) {
		priority = RocketChat.callbacks.priority.MEDIUM;
	}
	callback.priority = priority;
	callback.id = id || Random.id();
	RocketChat.callbacks[hook] = RocketChat.callbacks[hook] || [];
	if (RocketChat.callbacks.showTime === true) {
		const err = new Error;
		callback.stack = err.stack;
	}
	if (RocketChat.callbacks[hook].find((cb) => cb.id === callback.id)) {
		return;
	}
	RocketChat.callbacks[hook].push(callback);
};


/*
* Remove a callback from a hook
* @param {string} hook - The name of the hook
* @param {string} id - The callback's id
*/

RocketChat.callbacks.remove = function(hookName, id) {
	RocketChat.callbacks[hookName] = _.reject(RocketChat.callbacks[hookName], (callback) => callback.id === id);
};


/*
* Successively run all of a hook's callbacks on an item
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
* @returns {Object} Returns the item after it's been through all the callbacks for this hook
*/

RocketChat.callbacks.run = function(hook, item, constant) {
	const callbacks = RocketChat.callbacks[hook];
	if (callbacks && callbacks.length) {
		let totalTime = 0;
		const result = _.sortBy(callbacks, function(callback) {
			return callback.priority || RocketChat.callbacks.priority.MEDIUM;
		}).reduce(function(result, callback) {
			let time = 0;
			if (RocketChat.callbacks.showTime === true || RocketChat.callbacks.showTotalTime === true) {
				time = Date.now();
			}
			const callbackResult = callback(result, constant);
			if (RocketChat.callbacks.showTime === true || RocketChat.callbacks.showTotalTime === true) {
				const currentTime = Date.now() - time;
				totalTime += currentTime;
				if (RocketChat.callbacks.showTime === true) {
					if (Meteor.isServer) {
						RocketChat.statsTracker.timing('callbacks.time', currentTime, [`hook:${ hook }`, `callback:${ callback.id }`]);
					} else {
						let stack = callback.stack && typeof callback.stack.split === 'function' && callback.stack.split('\n');
						stack = stack && stack[2] && (stack[2].match(/\(.+\)/)||[])[0];
						console.log(String(currentTime), hook, callback.id, stack);
					}
				}
			}
			return (typeof callbackResult === 'undefined') ? result : callbackResult;
		}, item);
		if (RocketChat.callbacks.showTotalTime === true) {
			if (Meteor.isServer) {
				RocketChat.statsTracker.timing('callbacks.totalTime', totalTime, [`hook:${ hook }`]);
			} else {
				console.log(`${ hook }:`, totalTime);
			}
		}
		return result;
	} else {
		return item;
	}
};


/*
* Successively run all of a hook's callbacks on an item, in async mode (only works on server)
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
*/

RocketChat.callbacks.runAsync = function(hook, item, constant) {
	const callbacks = RocketChat.callbacks[hook];
	if (Meteor.isServer && callbacks && callbacks.length) {
		Meteor.defer(function() {
			_.sortBy(callbacks, (callback) => callback.priority || RocketChat.callbacks.priority.MEDIUM).forEach((callback) => callback(item, constant));
		});
	} else {
		return item;
	}
};
