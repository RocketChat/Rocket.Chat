import _ from 'underscore';

/*
* RocketChat.settings holds all packages settings
* @namespace RocketChat.settings
*/
RocketChat.settings = {
	callbacks: {},
	regexCallbacks: {},
	ts: new Date,
	get(_id, callback) {
		if (callback != null) {
			RocketChat.settings.onload(_id, callback);
			if (!Meteor.settings) {
				return;
			}
			if (_id === '*') {
				return Object.keys(Meteor.settings).forEach(key => {
					const value = Meteor.settings[key];
					callback(key, value);
				});
			}
			if (_.isRegExp(_id) && Meteor.settings) {
				return Object.keys(Meteor.settings).forEach(key => {
					if (!_id.test(key)) {
						return;
					}
					const value = Meteor.settings[key];
					callback(key, value);
				});
			}
			return Meteor.settings[_id] != null && callback(_id, Meteor.settings[_id]);
		} else {
			if (!Meteor.settings) {
				return;
			}
			if (_.isRegExp(_id)) {
				return Object.keys(Meteor.settings).reduce((items, key) => {
					const value = Meteor.settings[key];
					if (_id.test(key)) {
						items.push({
							key,
							value
						});
					}
					return items;
				}, []);
			}
			return Meteor.settings && Meteor.settings[_id];
		}
	},
	set(_id, value, callback) {
		return Meteor.call('saveSetting', _id, value, callback);
	},
	batchSet(settings, callback) {
		// async -> sync
		// http://daemon.co.za/2012/04/simple-async-with-only-underscore/
		const save = function(setting) {
			return function(callback) {
				return Meteor.call('saveSetting', setting._id, setting.value, setting.editor, callback);
			};
		};
		const actions = _.map(settings, (setting) => save(setting));
		return _(actions).reduceRight(_.wrap, (err, success) => callback(err, success))();
	},
	load(key, value, initialLoad) {
		['*', key].forEach(item => {
			if (RocketChat.settings.callbacks[item]) {
				RocketChat.settings.callbacks[item].forEach(callback => callback(key, value, initialLoad));
			}
		});
		Object.keys(RocketChat.settings.regexCallbacks).forEach(cbKey => {
			const cbValue = RocketChat.settings.regexCallbacks[cbKey];
			if (!cbValue.regex.test(key)) {
				return;
			}
			cbValue.callbacks.forEach(callback => callback(key, value, initialLoad));
		});
	},
	onload(key, callback) {
		// if key is '*'
		// 	for key, value in Meteor.settings
		// 		callback key, value, false
		// else if Meteor.settings?[_id]?
		// 	callback key, Meteor.settings[_id], false
		const keys = [].concat(key);
		keys.forEach(k => {
			if (_.isRegExp(k)) {
				RocketChat.settings.regexCallbacks[name = k.source] = RocketChat.settings.regexCallbacks[name = k.source] || {
					regex: k,
					callbacks: []
				};
				RocketChat.settings.regexCallbacks[k.source].callbacks.push(callback);
			} else {
				RocketChat.settings.callbacks[k] = RocketChat.settings.callbacks[k] || [];
				RocketChat.settings.callbacks[k].push(callback);
			}
		});
	}
};
