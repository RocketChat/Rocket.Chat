import { Emitter } from '@rocket.chat/emitter';
import _ from 'underscore';

import { ISetting, SettingValue } from '../../../definition/ISetting';
import { SystemLogger } from '../../../server/lib/logger/system';

const warn = process.env.NODE_ENV === 'development' || process.env.TEST_MODE;

type SettingsConfig = {
	debounce: number;
}

type OverCustomSettingsConfig = Partial<SettingsConfig>;

/**
 * Class responsible for setting up the settings, cache and propagation changes
 * Should be agnostic to the actual settings implementation, running on meteor or standalone
 * @extends Emitter
 * @alpha
 */
export const SettingsVersion4 = new class NewSettings extends Emitter<{
	ready: undefined;
	[k: string]: SettingValue;
}> {
	ready = false;

	store = new Map<string, SettingValue>();

	initilized(): void {
		if (this.ready) {
			return;
		}
		this.ready = true;
		this.emit('ready');
		SystemLogger.debug('Settings initalized');
	}

	/*
	* Gets the current value of the setting
	* @remarks
	* 		- In development mode if you are trying to get the value of a setting that is not defined, it will give an warning, in theory it makes sense, there no reason to do that
	* @param _id - The setting id
	* @returns {SettingValue} - The current value of the setting
	*/
	public get<T extends SettingValue = SettingValue>(_id: ISetting['_id']): T {
		if (!this.ready && warn) {
			SystemLogger.warn(`Settings not initialized yet. getting: ${ _id }`);
		}
		return this.store.get(_id) as T;
	}


	/*
	* Get the current value of the settings, and keep track of changes
	* @remarks
	* 		- This callback is debounced
	*       - The callback is not fire until the settings got initialized
	* @param _ids - Array of setting id
	* @param callback - The callback to run
	* @returns {() => void} - A function that can be used to cancel the observe
	*/
	public watchMultiple<T extends SettingValue = SettingValue>(_id: ISetting['_id'][], callback: (settings: T[]) => void): () => void {
		if (!this.ready) {
			const cancel = new Set<() => void>();
			const cancelFn = (): void => {
				cancel.add(this.watchMultiple(_id, callback));
				cancel.delete(cancelFn);
			};
			cancel.add(this.once('ready', cancelFn));
			return (): void => {
				cancel.forEach((fn) => fn());
			};
		}

		if (_id.every((id) => this.store.has(id))) {
			const settings = _id.map((id) => this.store.get(id));
			callback(settings as T[]);
		}
		const mergeFunction = _.debounce((): void => {
			callback(_id.map((id) => this.store.get(id)) as T[]);
		}, 100);
		const fns = _id.map((id) => this.change(id, mergeFunction));
		return (): void => {
			fns.forEach((fn) => fn());
		};
	}

	/*
	* Get the current value of the setting, and keep track of changes
	* @remarks
	* 		- This callback is debounced
	*       - The callback is not fire until the settings got initialized
	* @param _id - The setting id
	* @param callback - The callback to run
	* @returns {() => void} - A function that can be used to cancel the observe
	*/
	public watch<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void, config?: OverCustomSettingsConfig): () => void {
		const { debounce } = this.getConfig(config);
		const cb = _.debounce(callback, debounce);
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

		this.store.has(_id) && cb(this.store.get(_id) as T);
		return this.change(_id, cb);
	}

	/*
	* Get the current value of the setting, or wait until the initialized
	* @remarks
	* 		- This is a one time run
	* 		- This callback is debounced
	*       - The callback is not fire until the settings got initialized
	* @param _id - The setting id
	* @param callback - The callback to run
	* @returns {() => void} - A function that can be used to cancel the observe
	*/
	public watchOnce<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void, config?: OverCustomSettingsConfig): () => void {
		const { debounce } = this.getConfig(config);
		const cb = _.debounce(callback, debounce);
		if (this.store.has(_id)) {
			cb(this.store.get(_id) as T);
			return (): void => undefined;
		}
		return this.changeOnce(_id, cb);
	}


	/*
	* Observes the given setting by id and keep track of changes
	* @remarks
	* 		- This callback is debounced
	*       - The callback is not fire until the setting is changed
	*       - The callback is not fire until all the settings get initialized
	* @param _id - The setting id
	* @param callback - The callback to run
	* @returns {() => void} - A function that can be used to cancel the observe
	*/
	public change<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void, config?: OverCustomSettingsConfig): () => void {
		const { debounce } = this.getConfig(config);
		return this.on(_id, _.debounce(callback, debounce) as any);
	}

	/*
	* Observes multiple settings and keep track of changes
	* @remarks
	* 		- This callback is debounced
	*       - The callback is not fire until the setting is changed
	*       - The callback is not fire until all the settings get initialized
	* @param _ids - Array of setting id
	* @param callback - The callback to run
	* @returns {() => void} - A function that can be used to cancel the observe
	*/
	public changeMultiple<T extends SettingValue = SettingValue>(_ids: ISetting['_id'][], callback: (settings: T[]) => void, config?: OverCustomSettingsConfig): () => void {
		const { debounce } = this.getConfig(config);
		const mergeFunction = _.debounce((): void => {
			callback(_ids.map((id) => this.store.get(id)) as T[]);
		}, debounce);
		const fns = _ids.map((id) => this.change(id, mergeFunction));
		return (): void => {
			fns.forEach((fn) => fn());
		};
	}

	/*
	* Observes the setting and fires only if there is a change. Runs only once
	* @remarks
	* 		- This is a one time run
	* 		- This callback is debounced
	*       - The callback is not fire until the setting is changed
	*       - The callback is not fire until all the settings get initialized
	* @param _id - The setting id
	* @param callback - The callback to run
	* @returns {() => void} - A function that can be used to cancel the observe
	*/
	public changeOnce<T extends SettingValue = SettingValue>(_id: ISetting['_id'], callback: (args: T) => void, config?: OverCustomSettingsConfig): () => void {
		const { debounce } = this.getConfig(config);
		return this.once(_id, _.debounce(callback, debounce) as any);
	}

	/*
	* Sets the value of the setting
	* @remarks
	* 		- if the value set is the same as the current value, the change will not be fired
	*       - if the value is set before the initialization, the emit will be queued and will be fired after initialization
	* @param _id - The setting id
	* @param value - The value to set
	* @returns {void}
	*/
	public set<T extends SettingValue = SettingValue>(_id: ISetting['_id'], value: T): void {
		if (this.store.get(_id) === value) {
			return;
		}

		this.store.set(_id, value);

		if (!this.ready) {
			this.once('ready', () => {
				this.emit(_id, this.store.get(_id));
			});
			return;
		}

		this.emit(_id, value/* , old */);
	}

	public getConfig = (config?: OverCustomSettingsConfig): SettingsConfig => ({
		debounce: 500,
		...config,
	})
}();
