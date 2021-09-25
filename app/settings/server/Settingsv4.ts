import { Emitter } from '@rocket.chat/emitter';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { ISetting, SettingValue } from '../../../definition/ISetting';
import { SystemLogger } from '../../../server/lib/logger/system';

/**
 * class responsible for setting up the settings, cache and propagation changes
 * @class Settings
 **/

const warn = process.env.NODE_ENV === 'development' || process.env.TEST_MODE;

const store = new Map<string, SettingValue>();
export const SettingsVersion4 = new class NewSettings extends Emitter<{
	ready: undefined;
	[k: string]: SettingValue;
}> {
	ready = false;

	setInitialized(): void {
		this.ready = true;
		this.emit('ready');
		SystemLogger.info('Settings initalized');
	}

	public get<T extends SettingValue = SettingValue>(_id: ISetting['_id']): T {
		if (!this.ready && warn) {
			SystemLogger.warn(`Settings not initialized yet. getting: ${ _id }`);
		}
		return store.get(_id) as T;
	}

	public watchMultiple<T extends SettingValue = SettingValue>(_id: ISetting['_id'][], callback: (settings: T[]) => void): () => void {
		const cb = Meteor.bindEnvironment(callback);
		if (!this.ready) {
			const cancel = new Set<() => void>();
			const cancelFn = (): void => {
				cancel.add(this.watchMultiple(_id, cb));
				cancel.delete(cancelFn);
			};
			cancel.add(this.once('ready', cancelFn));
			return (): void => {
				cancel.forEach((fn) => fn());
			};
		}

		if (_id.every((id) => store.has(id))) {
			const settings = _id.map((id) => store.get(id));
			cb(settings as T[]);
		}
		const mergeFunction = _.debounce((): void => {
			cb(_id.map((id) => store.get(id)) as T[]);
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
		const cb = Meteor.bindEnvironment(callback);
		if (!this.ready) {
			const cancel = new Set<() => void>();
			const cancelFn = (): void => {
				cancel.add(this.watch(_id, cb));
				cancel.delete(cancelFn);
			};
			cancel.add(this.once('ready', cancelFn));
			return (): void => {
				cancel.forEach((fn) => fn());
			};
		}

		store.has(_id) && cb(store.get(_id) as T);
		return this.change(_id, callback);
	}

	/*
	* get the setting and keep track of changes for a setting
	*/
	public watchOnce<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void): () => void {
		const cb = Meteor.bindEnvironment(callback);
		if (store.has(_id)) {
			cb(store.get(_id) as T);
			return (): void => undefined;
		}
		return this.changeOnce(_id, callback);
	}


	/*
	* keep track of changes for a setting
	*/
	public change<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void): () => void {
		return this.on(_id, _.debounce(Meteor.bindEnvironment(callback), 100) as any);
	}

	public changeMultiple<T extends SettingValue = SettingValue>(_id: ISetting['_id'][], callback: (settings: T[]) => void): () => void {
		const fn = Meteor.bindEnvironment(callback);
		const mergeFunction = _.debounce((): void => {
			fn(_id.map((id) => store.get(id)) as T[]);
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
		return this.once(_id, _.debounce(Meteor.bindEnvironment(callback), 100) as any);
	}

	public set<T extends SettingValue = SettingValue>(_id: ISetting['_id'], value: T): void {
		if (store.get(_id) === value) {
			return;
		}

		// const old = Meteor.settings[_id];

		if (_id.startsWith('Accounts')) {
			console.log('SettingsVersion4 ---> ', _id, value);
		}
		store.set(_id, value);

		if (!this.ready) {
			this.once('ready', () => {
				this.emit(_id, store.get(_id));
			});
			return;
		}

		this.emit(_id, value/* , old */);
	}
}();
