import type { SettingValue } from '@rocket.chat/core-typings';

import { watch } from '../../meteor/watch';
import { PublicSettings } from '../../stores';

type SettingCallback = (key: string, value: SettingValue) => void;

class Settings {
	private readonly store = PublicSettings.use;

	/** Get a setting value Tracker-reactively */
	watch<TValue = any>(_id: string): TValue | undefined {
		return watch(this.store, (state) => state.get(_id)?.value) as TValue | undefined;
	}

	/** Get a setting value non-reactively */
	peek<TValue = any>(_id: string): TValue | undefined {
		return this.store.getState().get(_id)?.value as TValue | undefined;
	}

	init(): void {
		this.store.subscribe((state, prevState) => {
			const removedIds = new Set(prevState.records.keys()).difference(new Set(state.records.keys()));

			for (const _id of removedIds) {
				this.handleChange(_id, undefined);
			}

			for (const setting of state.records.values()) {
				if (setting.value !== prevState.get(setting._id)?.value) {
					this.handleChange(setting._id, setting.value);
				}
			}
		});
	}

	private callbacks = new Map<string, Set<SettingCallback>>();

	private handleChange(key: string, value: SettingValue): void {
		for (const _key of ['*', key]) {
			const callbacks = this.callbacks.get(_key);
			callbacks?.forEach((callback) => callback(_key, value));
		}
	}

	observe(key: string, callback: SettingCallback): () => void {
		// if key is '*'
		// 	for key, value in Meteor.settings
		// 		callback key, value, false
		// else if Meteor.settings?[_id]?
		// 	callback key, Meteor.settings[_id], false

		if (!this.callbacks.has(key)) {
			this.callbacks.set(key, new Set());
		}
		this.callbacks.get(key)?.add(callback);

		return () => {
			this.callbacks.get(key)?.delete(callback);
			if (this.callbacks.get(key)?.size === 0) {
				this.callbacks.delete(key);
			}
		};
	}
}

/** @deprecated prefer consuming settings from `SettingsContext` instead */
export const settings = new Settings();

settings.init();
