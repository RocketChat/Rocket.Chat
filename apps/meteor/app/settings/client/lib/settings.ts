import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import type { SettingValue } from '@rocket.chat/core-typings';

import { PublicSettingsCachedCollection } from '../../../../client/lib/settings/PublicSettingsCachedCollection';
import { SettingsBase } from '../../lib/settings';

class Settings extends SettingsBase {
	cachedCollection = PublicSettingsCachedCollection.get();

	collection = PublicSettingsCachedCollection.get().collection;

	dict = new ReactiveDict('settings');

	get(_id: string | RegExp, ...args: []): any {
		if (_id instanceof RegExp) {
			throw new Error('RegExp Settings.get(RegExp)');
		}
		if (args.length > 0) {
			throw new Error('settings.get(String, callback) only works on backend');
		}
		return this.dict.get(_id);
	}

	private _storeSettingValue(record: { _id: string; value: SettingValue }, initialLoad: boolean): void {
		Meteor.settings[record._id] = record.value;
		this.dict.set(record._id, record.value);
		this.load(record._id, record.value, initialLoad);
	}

	init(): void {
		let initialLoad = true;
		this.collection.find().observe({
			added: (record: { _id: string; value: SettingValue }) => this._storeSettingValue(record, initialLoad),
			changed: (record: { _id: string; value: SettingValue }) => this._storeSettingValue(record, initialLoad),
			removed: (record: { _id: string }) => {
				delete Meteor.settings[record._id];
				this.dict.set(record._id, null);
				this.load(record._id, undefined, initialLoad);
			},
		});
		initialLoad = false;
	}
}

export const settings = new Settings();

settings.init();
