import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { SettingValue } from '../../../definition/ISetting';

export type SettingComposedValue = {key: string; value: SettingValue};
export type SettingCallback = (key: string, value: SettingValue, initialLoad?: boolean) => void;

interface ISettingRegexCallbacks {
	regex: RegExp;
	callbacks: SettingCallback[];
}

export class SettingsBase {
	private callbacks = new Map<string, SettingCallback[]>();

	private regexCallbacks = new Map<string, ISettingRegexCallbacks>();

	// private ts = new Date()
	public get(_id: RegExp, callback?: SettingCallback): SettingComposedValue[];

	public get(_id: string, callback?: SettingCallback): SettingValue | void;

	public get(_id: string | RegExp, callback?: SettingCallback): SettingValue | SettingComposedValue[] | void {
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

			if (typeof _id === 'string') {
				return Meteor.settings[_id] != null && callback(_id, Meteor.settings[_id]);
			}
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
			const callbacks = this.callbacks.get(item);
			if (callbacks) {
				callbacks.forEach((callback) => callback(key, value, initialLoad));
			}
		});
		this.regexCallbacks.forEach((cbValue) => {
			if (!cbValue?.regex.test(key)) {
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
				if (!this.regexCallbacks.has(k.source)) {
					this.regexCallbacks.set(k.source, {
						regex: k,
						callbacks: [],
					});
				}
				this.regexCallbacks.get(k.source)?.callbacks.push(callback);
			} else {
				if (!this.callbacks.has(k)) {
					this.callbacks.set(k, []);
				}
				this.callbacks.get(k)?.push(callback);
			}
		});
	}
}
