import { Emitter } from '@rocket.chat/emitter';
import _ from 'underscore';
import { ISetting, SettingValue } from '@rocket.chat/core-typings';

import { SystemLogger } from '../../../server/lib/logger/system';

const warn = process.env.NODE_ENV === 'development' || process.env.TEST_MODE;

type SettingsConfig = {
	debounce: number;
};

type OverCustomSettingsConfig = Partial<SettingsConfig>;

export interface ICachedSettings {
	/*
	 * @description: The settings object as ready
	 */
	initilized(): void;

	/*
	 * returns if the setting is defined
	 * @param _id - The setting id
	 * @returns {boolean}
	 */
	has(_id: ISetting['_id']): boolean;

	/*
	 * Gets the current Object of the setting
	 * @param _id - The setting id
	 * @returns {ISetting} - The current Object of the setting
	 */
	getSetting(_id: ISetting['_id']): ISetting | undefined;

	/*
	 * Gets the current value of the setting
	 * @remarks
	 * 		- In development mode if you are trying to get the value of a setting that is not defined, it will give an warning, in theory it makes sense, there no reason to do that
	 * @param _id - The setting id
	 * @returns {SettingValue} - The current value of the setting
	 */
	get<T extends SettingValue = SettingValue>(_id: ISetting['_id']): T;

	/*
	 * Gets the current value of the setting
	 * @remarks
	 * 		- In development mode if you are trying to get the value of a setting that is not defined, it will give an warning, in theory it makes sense, there no reason to do that
	 * @param _id - The setting id
	 * @returns {SettingValue} - The current value of the setting
	 *
	 */
	/* @deprecated */
	getByRegexp<T extends SettingValue = SettingValue>(_id: RegExp): [string, T][];

	/*
	 * Get the current value of the settings, and keep track of changes
	 * @remarks
	 * 		- This callback is debounced
	 *       - The callback is not fire until the settings got initialized
	 * @param _ids - Array of setting id
	 * @param callback - The callback to run
	 * @returns {() => void} - A function that can be used to cancel the observe
	 */
	watchMultiple<T extends SettingValue = SettingValue>(_id: ISetting['_id'][], callback: (settings: T[]) => void): () => void;

	/*
	 * Get the current value of the setting, and keep track of changes
	 * @remarks
	 * 		- This callback is debounced
	 *       - The callback is not fire until the settings got initialized
	 * @param _id - The setting id
	 * @param callback - The callback to run
	 * @returns {() => void} - A function that can be used to cancel the observe
	 */
	watch<T extends SettingValue = SettingValue>(_id: ISetting['_id'], cb: (args: T) => void, config?: OverCustomSettingsConfig): () => void;

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
	watchOnce<T extends SettingValue = SettingValue>(
		_id: ISetting['_id'],
		cb: (args: T) => void,
		config?: OverCustomSettingsConfig,
	): () => void;

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
	change<T extends SettingValue = SettingValue>(
		_id: ISetting['_id'],
		callback: (args: T) => void,
		config?: OverCustomSettingsConfig,
	): () => void;

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
	changeMultiple<T extends SettingValue = SettingValue>(
		_ids: ISetting['_id'][],
		callback: (settings: T[]) => void,
		config?: OverCustomSettingsConfig,
	): () => void;

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
	changeOnce<T extends SettingValue = SettingValue>(
		_id: ISetting['_id'],
		callback: (args: T) => void,
		config?: OverCustomSettingsConfig,
	): () => void;

	/*
	 * Sets the value of the setting
	 * @remarks
	 * 		- if the value set is the same as the current value, the change will not be fired
	 *       - if the value is set before the initialization, the emit will be queued and will be fired after initialization
	 * @param _id - The setting id
	 * @param value - The value to set
	 * @returns {void}
	 */
	set(record: ISetting): void;

	getConfig(config?: OverCustomSettingsConfig): SettingsConfig;

	/* @deprecated */
	watchByRegex(regex: RegExp, cb: (...args: [string, SettingValue]) => void, config?: OverCustomSettingsConfig): () => void;

	/* @deprecated */
	changeByRegex(regex: RegExp, callback: (...args: [string, SettingValue]) => void, config?: OverCustomSettingsConfig): () => void;

	/*
	 * @description: Wait until the settings get ready then run the callback
	 */
	onReady(cb: () => void): void;
}

/**
 * Class responsible for setting up the settings, cache and propagation changes
 * Should be agnostic to the actual settings implementation, running on meteor or standalone
 *
 * You should not instantiate this class directly, only for testing purposes
 *
 * @extends Emitter
 * @alpha
 */
export class CachedSettings
	extends Emitter<
		{
			'*': [string, SettingValue];
		} & {
			ready: undefined;
			[k: string]: SettingValue;
		}
	>
	implements ICachedSettings
{
	ready = false;

	store = new Map<string, ISetting>();

	initilized(): void {
		if (this.ready) {
			return;
		}
		this.ready = true;
		this.emit('ready');
		SystemLogger.debug('Settings initalized');
	}

	/*
	 * returns if the setting is defined
	 * @param _id - The setting id
	 * @returns {boolean}
	 */
	public has(_id: ISetting['_id']): boolean {
		if (!this.ready && warn) {
			SystemLogger.warn(`Settings not initialized yet. getting: ${_id}`);
		}
		return this.store.has(_id);
	}

	public getSetting(_id: ISetting['_id']): ISetting | undefined {
		if (!this.ready && warn) {
			SystemLogger.warn(`Settings not initialized yet. getting: ${_id}`);
		}
		return this.store.get(_id);
	}

	/*
	 * Gets the current value of the setting
	 * @remarks
	 * 		- In development mode if you are trying to get the value of a setting that is not defined, it will give an warning, in theory it makes sense, there no reason to do that
	 * 		- The setting's value will be cached in memory so it won't call the DB every time you fetch a particular setting
	 * @param _id - The setting id
	 * @returns {SettingValue} - The current value of the setting
	 */
	public get<T extends SettingValue = SettingValue>(_id: ISetting['_id']): T {
		if (!this.ready && warn) {
			SystemLogger.warn(`Settings not initialized yet. getting: ${_id}`);
		}
		return this.store.get(_id)?.value as T;
	}

	/*
	 * Gets the current value of the setting
	 * @remarks
	 * 		- In development mode if you are trying to get the value of a setting that is not defined, it will give an warning, in theory it makes sense, there no reason to do that
	 * @param _id - The setting id
	 * @returns {SettingValue} - The current value of the setting
	 *
	 */
	/* @deprecated */
	public getByRegexp<T extends SettingValue = SettingValue>(_id: RegExp): [string, T][] {
		if (!this.ready && warn) {
			SystemLogger.warn(`Settings not initialized yet. getting: ${_id}`);
		}

		return [...this.store.entries()].filter(([key]) => _id.test(key)).map(([key, setting]) => [key, setting.value]) as [string, T][];
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

			cancel.add(
				this.once('ready', (): void => {
					cancel.clear();
					cancel.add(this.watchMultiple(_id, callback));
				}),
			);
			return (): void => {
				cancel.forEach((fn) => fn());
			};
		}

		if (_id.every((id) => this.store.has(id))) {
			const settings = _id.map((id) => this.store.get(id)?.value);
			callback(settings as T[]);
		}
		const mergeFunction = _.debounce((): void => {
			callback(_id.map((id) => this.store.get(id)?.value) as T[]);
		}, 100);

		const fns = _id.map((id) => this.on(id, mergeFunction));
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
	public watch<T extends SettingValue = SettingValue>(
		_id: ISetting['_id'],
		cb: (args: T) => void,
		config?: OverCustomSettingsConfig,
	): () => void {
		if (!this.ready) {
			const cancel = new Set<() => void>();
			cancel.add(
				this.once('ready', (): void => {
					cancel.clear();
					cancel.add(this.watch(_id, cb, config));
				}),
			);
			return (): void => {
				cancel.forEach((fn) => fn());
			};
		}

		this.store.has(_id) && cb(this.store.get(_id)?.value as T);
		return this.change(_id, cb, config);
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
	public watchOnce<T extends SettingValue = SettingValue>(
		_id: ISetting['_id'],
		cb: (args: T) => void,
		config?: OverCustomSettingsConfig,
	): () => void {
		if (this.store.has(_id)) {
			cb(this.store.get(_id)?.value as T);
			return (): void => undefined;
		}
		return this.changeOnce(_id, cb, config);
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
	public change<T extends SettingValue = SettingValue>(
		_id: ISetting['_id'],
		callback: (args: T) => void,
		config?: OverCustomSettingsConfig,
	): () => void {
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
	public changeMultiple<T extends SettingValue = SettingValue>(
		_ids: ISetting['_id'][],
		callback: (settings: T[]) => void,
		config?: OverCustomSettingsConfig,
	): () => void {
		const fns = _ids.map((id) =>
			this.change(
				id,
				(): void => {
					callback(_ids.map((id) => this.store.get(id)?.value) as T[]);
				},
				config,
			),
		);
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
	public changeOnce<T extends SettingValue = SettingValue>(
		_id: ISetting['_id'],
		callback: (args: T) => void,
		config?: OverCustomSettingsConfig,
	): () => void {
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
	public set(record: ISetting): void {
		if (this.store.has(record._id) && this.store.get(record._id)?.value === record.value) {
			return;
		}

		this.store.set(record._id, record);
		if (!this.ready) {
			this.once('ready', () => {
				this.emit(record._id, this.store.get(record._id)?.value);
				this.emit('*', [record._id, this.store.get(record._id)?.value]);
			});
			return;
		}
		this.emit(record._id, this.store.get(record._id)?.value);
		this.emit('*', [record._id, this.store.get(record._id)?.value]);
	}

	public getConfig = (config?: OverCustomSettingsConfig): SettingsConfig => ({
		debounce: 500,
		...config,
	});

	/* @deprecated */
	public watchByRegex(regex: RegExp, cb: (...args: [string, SettingValue]) => void, config?: OverCustomSettingsConfig): () => void {
		if (!this.ready) {
			const cancel = new Set<() => void>();
			cancel.add(
				this.once('ready', (): void => {
					cancel.clear();
					cancel.add(this.watchByRegex(regex, cb, config));
				}),
			);
			return (): void => {
				cancel.forEach((fn) => fn());
			};
		}
		[...this.store.entries()].forEach(([key, setting]) => {
			if (regex.test(key)) {
				cb(key, setting.value);
			}
		});

		return this.changeByRegex(regex, cb, config);
	}

	/* @deprecated */
	public changeByRegex(regex: RegExp, callback: (...args: [string, SettingValue]) => void, config?: OverCustomSettingsConfig): () => void {
		const store: Map<string, (...args: [string, SettingValue]) => void> = new Map();
		return this.on('*', ([_id, value]) => {
			if (regex.test(_id)) {
				const { debounce } = this.getConfig(config);
				const cb = store.get(_id) || _.debounce(callback, debounce);
				cb(_id, value);
				store.set(_id, cb);
			}
			regex.lastIndex = 0;
		});
	}

	public onReady(cb: () => void): void {
		if (this.ready) {
			return cb();
		}
		this.once('ready', cb);
	}
}
