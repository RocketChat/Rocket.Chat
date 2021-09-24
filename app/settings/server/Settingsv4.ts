import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { ISetting, SettingValue } from '../../../definition/ISetting';


/**
 * class responsible for setting up the settings, cache and propagation changes
 * @class Settings
 **/

export const SettingsVersion4 = new class NewSettings extends Emitter {
	initialized = false;

	public get<T extends SettingValue = SettingValue>(_id: ISetting['_id']): T {
		return Meteor.settings[_id];
	}

	public watchMultiple<T extends SettingValue = SettingValue>(_id: ISetting['_id'][], fn: (settings: T[]) => void): () => void {
		if (_id.every((id) => Meteor.settings.hasOwnProperty(id))) {
			const settings = _id.map((id) => Meteor.settings[id]);
			fn(settings);
		}
		const mergeFunction = _.debounce((): void => {
			fn(_id.map((id) => Meteor.settings[id]));
		}, 100);
		const fns = _id.map((id) => this.change(id, mergeFunction));
		return (): void => {
			fns.forEach((fn) => fn());
		};
	}

	/*
	* get the setting and keep track of changes for a setting
	*/
	public watch<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void): () => void {
		Meteor.settings.hasOwnProperty(_id) && callback(Meteor.settings[_id]);
		return this.change(_id, callback);
	}

	/*
	* get the setting and keep track of changes for a setting
	*/
	public watchOnce<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void): () => void {
		if (Meteor.settings.hasOwnProperty(_id)) {
			callback(Meteor.settings[_id]);
			return (): void => undefined;
		}
		return this.changeOnce(_id, callback);
	}


	/*
	* keep track of changes for a setting
	*/
	public change<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void): () => void {
		return this.on(_id, _.debounce(callback, 100));
	}

	public changeMultiple<T extends SettingValue = SettingValue>(_id: ISetting['_id'][], fn: (settings: T[]) => void): () => void {
		const mergeFunction = _.debounce((): void => {
			fn(_id.map((id) => Meteor.settings[id]));
		}, 100);
		const fns = _id.map((id) => this.change(id, mergeFunction));
		return (): void => {
			fns.forEach((fn) => fn());
		};
	}

	/*
	* keep track of changes for a setting
	*/
	public changeOnce<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void): () => void {
		return this.once(_id, _.debounce(callback, 100));
	}
}();
