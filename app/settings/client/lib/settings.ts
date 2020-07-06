import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';

import { PublicSettingsCachedCollection } from '../../../../client/lib/settings/PublicSettingsCachedCollection';
import { SettingsBase, SettingValue, ISettingRecord } from '../../lib/settings';
import { hasLicense } from '../../../../ee/app/license/client';

let isEnterprise = false;

class Settings extends SettingsBase {
	cachedCollection = PublicSettingsCachedCollection.get()

	collection = PublicSettingsCachedCollection.get().collection;

	dict = new ReactiveDict<any>('settings');

	get(_id: string): any {
		return this.dict.get(_id);
	}

	getRecordValue(record: ISettingRecord): SettingValue {
		const { value, invalidValue } = record;

		if (!record.enterprise) {
			return value;
		}

		if (!isEnterprise) {
			return invalidValue;
		}

		if (!record.modules?.length) {
			return value;
		}

		for (const moduleName of record.modules) {
			if (!hasLicense(moduleName)) {
				return invalidValue;
			}
		}

		return value;
	}

	private _storeSettingValue(record: ISettingRecord, initialLoad: boolean): void {
		const value = this.getRecordValue(record);
		Meteor.settings[record._id] = value;
		this.dict.set(record._id, value);
		this.load(record._id, value, initialLoad);
	}

	init(): void {
		let initialLoad = true;
		this.collection.find().observe({
			added: (record: ISettingRecord) => this._storeSettingValue(record, initialLoad),
			changed: (record: ISettingRecord) => this._storeSettingValue(record, initialLoad),
			removed: (record: ISettingRecord) => {
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

Meteor.startup(() => {
	Meteor.call('license:isEnterprise', (err: any, result: any) => {
		if (err) {
			throw err;
		}

		if (result) {
			isEnterprise = true;
		}
	});
});
