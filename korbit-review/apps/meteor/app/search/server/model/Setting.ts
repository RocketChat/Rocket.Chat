import type { SettingValue } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

/**
 * Setting Object in order to manage settings loading for providers and admin ui display
 */
export class Setting {
	private readonly _basekey: string;

	public readonly key: string;

	public readonly type: string;

	public readonly defaultValue: SettingValue;

	public readonly options: Record<string, unknown>;

	private _value: SettingValue;

	constructor(basekey: string, key: string, type: string, defaultValue: SettingValue, options = {}) {
		this._basekey = basekey;
		this.key = key;
		this.type = type;
		this.defaultValue = defaultValue;
		this.options = options;
		this._value = undefined;
	}

	get value() {
		return this._value;
	}

	/**
	 * Id is generated based on baseKey and key
	 */
	get id() {
		return `Search.${this._basekey}.${this.key}`;
	}

	load() {
		this._value = settings.get(this.id);

		if (this._value === undefined) {
			this._value = this.defaultValue;
		}
	}
}
