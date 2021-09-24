import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { ISetting, SettingValue } from '../../../definition/ISetting';
import { SystemLogger } from '/server/lib/logger/system';


/**
 * class responsible for setting up the settings, cache and propagation changes
 * @class Settings
 **/

export const SettingsVersion4 = new class NewSettings extends Emitter<{
	ready: undefined;
	[k: string]: SettingValue;
}> {
	ready = false;

	setInitialized(): void {
		this.ready = true;
		this.emit('ready');

		console.log('Settings initialized');
	}

	public get<T extends SettingValue = SettingValue>(_id: ISetting['_id']): T {
		if (!this.ready && process.env.NODE_ENV === 'development') {
			SystemLogger.warn(`Settings not initialized yet. getting: ${ _id }`);
		}
		return Meteor.settings[_id];
	}

	public watchMultiple<T extends SettingValue = SettingValue>(_id: ISetting['_id'][], callback: (settings: T[]) => void): () => void {
		if (!this.ready) {
			console.log('watchMultiple: Settings not initialized yet. watching ready: ', _id);
			const cancel = new Set<() => void>();
			const cancelFn = () => {
				cancel.add(this.watchMultiple(_id, callback));
				cancel.delete(cancelFn);
			};
			cancel.add(this.once('ready', cancelFn));
			return (): void => {
				cancel.forEach((fn) => fn());
			};
		}

		if (_id.every((id) => Meteor.settings.hasOwnProperty(id))) {
			const settings = _id.map((id) => Meteor.settings[id]);
			callback(settings);
		}
		const mergeFunction = _.debounce((): void => {
			callback(_id.map((id) => Meteor.settings[id]));
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
		if (!this.ready) {
			console.log('watch: Settings not initialized yet. watching ready: ', _id);
			const cancel = new Set<() => void>();
			const cancelFn = () => {
				cancel.add(this.watch(_id, callback));
				cancel.delete(cancelFn);
			};
			cancel.add(this.once('ready', cancelFn));
			return (): void => {
				cancel.forEach((fn) => fn());
			};
		}

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
