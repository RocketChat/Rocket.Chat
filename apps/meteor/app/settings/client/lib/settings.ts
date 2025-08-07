import { Meteor } from 'meteor/meteor';

import { watch } from '../../../../client/lib/cachedStores';
import { PublicSettings } from '../../../../client/stores';
import { SettingsBase } from '../../lib/settings';

class Settings extends SettingsBase {
	private readonly store = PublicSettings.use;

	override get<TValue = any>(_id: string | RegExp, ...args: []): TValue {
		if (_id instanceof RegExp) {
			throw new Error('RegExp Settings.get(RegExp)');
		}
		if (args.length > 0) {
			throw new Error('settings.get(String, callback) only works on backend');
		}

		return watch(this.store, (state) => state.get(_id)?.value) as TValue;
	}

	init(): void {
		let initialLoad = true;
		this.store.subscribe((state) => {
			const removedIds = new Set(Object.keys(Meteor.settings)).difference(new Set(state.records.keys()));

			for (const _id of removedIds) {
				delete Meteor.settings[_id];
				this.load(_id, undefined, initialLoad);
			}

			for (const setting of state.records.values()) {
				if (setting.value !== Meteor.settings[setting._id]) {
					Meteor.settings[setting._id] = setting.value;
					this.load(setting._id, setting.value, initialLoad);
				}
			}
		});
		initialLoad = false;
	}
}

export const settings = new Settings();

settings.init();
