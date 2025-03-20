import type { SettingValue } from '@rocket.chat/core-typings';

import { Setting } from './Setting';

/**
 * Settings Object allows to manage Setting Objects
 */
export class Settings {
	private settings: Record<string, Setting>;

	constructor(public basekey: string) {
		this.settings = {};
	}

	add(key: string, type: string, defaultValue: SettingValue, options: Record<string, unknown>) {
		this.settings[key] = new Setting(this.basekey, key, type, defaultValue, options);
	}

	list() {
		return Object.keys(this.settings).map((key) => this.settings[key]);
	}

	map() {
		return this.settings;
	}

	/**
	 * return the value for key
	 */
	get<TValue>(key: string) {
		if (!this.settings[key]) {
			throw new Error('Setting is not set');
		}
		return this.settings[key].value as TValue;
	}

	/**
	 * load currently stored values of all settings
	 */
	load() {
		Object.keys(this.settings).forEach((key) => {
			this.settings[key].load();
		});
	}
}
