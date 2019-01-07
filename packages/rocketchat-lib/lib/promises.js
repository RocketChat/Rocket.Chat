import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import _ from 'underscore';

/*
* Callback hooks provide an easy way to add extra steps to common operations.
* @namespace RocketChat.promises
*/

RocketChat.promises = {};


/*
* Callback priorities
*/

RocketChat.promises.priority = {
	HIGH: -1000,
	MEDIUM: 0,
	LOW: 1000,
};

const getHook = (hookName) => RocketChat.promises[hookName] || [];

/*
* Add a callback function to a hook
* @param {String} hook - The name of the hook
* @param {Function} callback - The callback function
*/

RocketChat.promises.add = function(hook, callback, p = RocketChat.promises.priority.MEDIUM, id) {
	callback.priority = _.isNumber(p) ? p : RocketChat.promises.priority.MEDIUM;
	callback.id = id || Random.id();
	RocketChat.promises[hook] = getHook(hook);
	if (RocketChat.promises[hook].find((cb) => cb.id === callback.id)) {
		return;
	}
	RocketChat.promises[hook].push(callback);
	RocketChat.promises[hook] = _.sortBy(RocketChat.promises[hook], (callback) => callback.priority || RocketChat.promises.priority.MEDIUM);
};


/*
* Remove a callback from a hook
* @param {string} hook - The name of the hook
* @param {string} id - The callback's id
*/

RocketChat.promises.remove = function(hook, id) {
	RocketChat.promises[hook] = getHook(hook).filter((callback) => callback.id !== id);
};


/*
* Successively run all of a hook's callbacks on an item
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
* @returns {Object} Returns the item after it's been through all the callbacks for this hook
*/

RocketChat.promises.run = function(hook, item, constant) {
	const callbacks = RocketChat.promises[hook];
	if (callbacks == null || callbacks.length === 0) {
		return Promise.resolve(item);
	}
	return callbacks.reduce((previousPromise, callback) => previousPromise.then((result) => callback(result, constant)), Promise.resolve(item));
};


/*
* Successively run all of a hook's callbacks on an item, in async mode (only works on server)
* @param {String} hook - The name of the hook
* @param {Object} item - The post, comment, modifier, etc. on which to run the callbacks
* @param {Object} [constant] - An optional constant that will be passed along to each callback
*/

RocketChat.promises.runAsync = function(hook, item, constant) {
	const callbacks = RocketChat.promises[hook];
	if (!Meteor.isServer || callbacks == null || callbacks.length === 0) {
		return item;
	}
	Meteor.defer(() => callbacks.forEach((callback) => callback(item, constant)));
};
