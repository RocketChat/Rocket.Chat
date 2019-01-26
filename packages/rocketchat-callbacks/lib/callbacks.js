import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import _ from 'underscore';

/*
* Callback hooks provide an easy way to add extra steps to common operations.
* @namespace RocketChat.callbacks
*/

export const callbacks = {};

if (Meteor.isServer) {
	callbacks.showTime = true;
	callbacks.showTotalTime = true;
} else {
	callbacks.showTime = false;
	callbacks.showTotalTime = false;
}


/*
* Callback priorities
*/

callbacks.priority = {
	HIGH: -1000,
	MEDIUM: 0,
	LOW: 1000,
};

const getHooks = (hookName) => callbacks[hookName] || [];

/*
* Add a callback function to a hook
* @param {String} hook - The name of the hook
* @param {Function} callback - The callback function
*/

callbacks.add = function(hook, callback, priority, id = Random.id()) {
	if (!_.isNumber(priority)) {
		priority = callbacks.priority.MEDIUM;
	}
	callback.priority = priority;
	callback.id = id;
	callbacks[hook] = getHooks(hook);

	if (callbacks.showTime === true) {
		const err = new Error;
		callback.stack = err.stack;
	}

	if (callbacks[hook].find((cb) => cb.id === callback.id)) {
		return;
	}
	callbacks[hook].push(callback);
	callbacks[hook] = _.sortBy(callbacks[hook], function(callback) {
		return callback.priority || callbacks.priority.MEDIUM;
	});
};


/*
* Remove a callback from a hook
* @param {string} hook - The name of the hook
* @param {string} id - The callback's id
*/

callbacks.remove = function(hook, id) {
	callbacks[hook] = getHooks(hook).filter((callback) => callback.id !== id);
};

callbacks.runItem = function({ callback, result, constant /* , hook */ }) {
	return callback(result, constant);
};

/*
* Successively run all of a hook's callbacks on an item
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
* @returns {Object} Returns the item after it's been through all the callbacks for this hook
*/

callbacks.run = function(hook, item, constant) {
	const callbackItems = callbacks[hook];
	if (!callbackItems || !callbackItems.length) {
		return item;
	}

	let totalTime = 0;
	const result = callbackItems.reduce(function(result, callback) {
		const time = callbacks.showTime === true || callbacks.showTotalTime === true ? Date.now() : 0;

		const callbackResult = callbacks.runItem({ hook, callback, result, constant, time });

		if (callbacks.showTime === true || callbacks.showTotalTime === true) {
			const currentTime = Date.now() - time;
			totalTime += currentTime;
			if (callbacks.showTime === true) {
				if (!Meteor.isServer) {
					let stack = callback.stack && typeof callback.stack.split === 'function' && callback.stack.split('\n');
					stack = stack && stack[2] && (stack[2].match(/\(.+\)/) || [])[0];
					console.log(String(currentTime), hook, callback.id, stack);
				}
			}
		}
		return (typeof callbackResult === 'undefined') ? result : callbackResult;
	}, item);

	if (callbacks.showTotalTime === true) {
		if (!Meteor.isServer) {
			console.log(`${ hook }:`, totalTime);
		}
	}

	return result;

};


/*
* Successively run all of a hook's callbacks on an item, in async mode (only works on server)
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
*/

callbacks.runAsync = function(hook, item, constant) {
	const callbackItems = callbacks[hook];
	if (Meteor.isServer && callbackItems && callbackItems.length) {
		Meteor.defer(function() {
			callbackItems.forEach((callback) => callback(item, constant));
		});
	}
	return item;
};
