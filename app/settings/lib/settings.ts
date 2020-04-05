import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

export type SettingValueMultiSelect = Array<{key: string; i18nLabel: string}>
export type SettingValueRoomPick = Array<{_id: string; name: string}> | string
export type SettingValue = string | boolean | number | SettingValueMultiSelect | undefined;
export type SettingComposedValue = {key: string; value: SettingValue};
export type SettingCallback = (key: string, value: SettingValue, initialLoad?: boolean) => void;

interface ISettingCallbacks {
	[key: string]: SettingCallback[];
}

interface ISettingRegexCallbacks {
	[key: string]: {
		regex: RegExp;
		callbacks: SettingCallback[];
	};
}

export class SettingsBase {
	private callbacks: ISettingCallbacks = {}

	private regexCallbacks: ISettingRegexCallbacks = {}

	// private ts = new Date()

	public get(_id: string, callback?: SettingCallback): SettingValue | SettingComposedValue[] | void {
		if (callback != null) {
			this.onload(_id, callback);
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
			return Object.keys(Meteor.settings).reduce((items: SettingComposedValue[], key) => {
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
	}

	set(_id: string, value: SettingValue, callback: () => void): void {
		Meteor.call('saveSetting', _id, value, callback);
	}

	batchSet(settings: Array<{_id: string; value: SettingValue}>, callback: () => void): void {
		Meteor.call('saveSettings', settings, callback);
	}

	load(key: string, value: SettingValue, initialLoad: boolean): void {
		['*', key].forEach((item) => {
			if (this.callbacks[item]) {
				this.callbacks[item].forEach((callback) => callback(key, value, initialLoad));
			}
		});
		Object.keys(this.regexCallbacks).forEach((cbKey) => {
			const cbValue = this.regexCallbacks[cbKey];
			if (!cbValue.regex.test(key)) {
				return;
			}
			cbValue.callbacks.forEach((callback) => callback(key, value, initialLoad));
		});
	}

	onload(key: string | string[] | RegExp | RegExp[], callback: SettingCallback): void {
		// if key is '*'
		// 	for key, value in Meteor.settings
		// 		callback key, value, false
		// else if Meteor.settings?[_id]?
		// 	callback key, Meteor.settings[_id], false
		const keys: Array<string | RegExp> = Array.isArray(key) ? key : [key];
		keys.forEach((k) => {
			if (_.isRegExp(k)) {
				this.regexCallbacks[k.source] = this.regexCallbacks[k.source] || {
					regex: k,
					callbacks: [],
				};
				this.regexCallbacks[k.source].callbacks.push(callback);
			} else {
				this.callbacks[k] = this.callbacks[k] || [];
				this.callbacks[k].push(callback);
			}
		});
	}
}
