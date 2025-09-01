import type { SettingValue } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { PublicSettings } from '../../stores';
import { watch } from '../cachedStores';

type SettingCallback = (key: string, value: SettingValue) => void;

class Settings {
	private readonly store = PublicSettings.use;

	watch<TValue = any>(_id: string): TValue {
		return watch(this.store, (state) => state.get(_id)?.value) as TValue;
	}

	init(): void {
		this.store.subscribe((state) => {
			const removedIds = new Set(Object.keys(Meteor.settings)).difference(new Set(state.records.keys()));

			for (const _id of removedIds) {
				delete Meteor.settings[_id];
				this.load(_id, undefined);
			}

			for (const setting of state.records.values()) {
				if (setting.value !== Meteor.settings[setting._id]) {
					Meteor.settings[setting._id] = setting.value;
					this.load(setting._id, setting.value);
				}
			}
		});
	}

	private callbacks = new Map<string, SettingCallback[]>();

	load(key: string, value: SettingValue): void {
		['*', key].forEach((item) => {
			const callbacks = this.callbacks.get(item);
			if (callbacks) {
				callbacks.forEach((callback) => callback(key, value));
			}
		});
	}

	onload(key: string, callback: SettingCallback): void {
		// if key is '*'
		// 	for key, value in Meteor.settings
		// 		callback key, value, false
		// else if Meteor.settings?[_id]?
		// 	callback key, Meteor.settings[_id], false

		if (!this.callbacks.has(key)) {
			this.callbacks.set(key, []);
		}
		this.callbacks.get(key)?.push(callback);
	}
}

/** @deprecated prefer consuming settings from `SettingsContext` instead */
export const settings = new Settings();

settings.init();
