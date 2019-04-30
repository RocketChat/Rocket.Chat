import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

export const settings = {
	callbacks: {},
	regexCallbacks: {},
	ts: new Date,
	get(_id, callback) {
		if (callback != null) {
			settings.onload(_id, callback);
			if (!Meteor.settings) {
				return;
			}
			if (_id === '*') {
				return Object.keys(Meteor.settings).forEach((key) => {
					const value = Meteor.settings[key];
					callback(key, value);
				});
			}
			if (_.isRegExp(_id) && Meteor.settings) {
				return Object.keys(Meteor.settings).forEach((key) => {
					if (!_id.test(key)) {
						return;
					}
					const value = Meteor.settings[key];
					callback(key, value);
				});
			}
			return Meteor.settings[_id] != null && callback(_id, Meteor.settings[_id]);
		}
		if (!Meteor.settings) {
			return;
		}
		if (_.isRegExp(_id)) {
			return Object.keys(Meteor.settings).reduce((items, key) => {
				const value = Meteor.settings[key];
				if (_id.test(key)) {
					items.push({
						key,
						value,
					});
				}
				return items;
			}, []);
		}
		return Meteor.settings && Meteor.settings[_id];
	},
	set(_id, value, callback) {
		return Meteor.call('saveSetting', _id, value, callback);
	},
	batchSet(settings, callback) {
		return Meteor.call('saveSettings', settings, callback);
	},
	load(key, value, initialLoad) {
		['*', key].forEach((item) => {
			if (settings.callbacks[item]) {
				settings.callbacks[item].forEach((callback) => callback(key, value, initialLoad));
			}
		});
		Object.keys(settings.regexCallbacks).forEach((cbKey) => {
			const cbValue = settings.regexCallbacks[cbKey];
			if (!cbValue.regex.test(key)) {
				return;
			}
			cbValue.callbacks.forEach((callback) => callback(key, value, initialLoad));
		});
	},
	onload(key, callback) {
		// if key is '*'
		// 	for key, value in Meteor.settings
		// 		callback key, value, false
		// else if Meteor.settings?[_id]?
		// 	callback key, Meteor.settings[_id], false
		const keys = [].concat(key);
		keys.forEach((k) => {
			if (_.isRegExp(k)) {
				settings.regexCallbacks[name = k.source] = settings.regexCallbacks[name = k.source] || {
					regex: k,
					callbacks: [],
				};
				settings.regexCallbacks[k.source].callbacks.push(callback);
			} else {
				settings.callbacks[k] = settings.callbacks[k] || [];
				settings.callbacks[k].push(callback);
			}
		});
	},
};
