import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';

import { CachedCollection } from '../../../ui-cached-collection';
import { SettingsBase, SettingValue } from '../../lib/settings';

const cachedCollection = new CachedCollection({
	name: 'public-settings',
	eventType: 'onAll',
	userRelated: false,
	listenChangesForLoggedUsersOnly: true,
});

class Settings extends SettingsBase {
	cachedCollection = cachedCollection

	collection = cachedCollection.collection;

	dict = new ReactiveDict<any>('settings');

	get(_id: string): any {
		return this.dict.get(_id);
	}

	init(): void {
		let initialLoad = true;
		this.collection.find().observe({
			added: (record: {_id: string; value: SettingValue}) => {
				Meteor.settings[record._id] = record.value;
				this.dict.set(record._id, record.value);
				this.load(record._id, record.value, initialLoad);
			},
			changed: (record: {_id: string; value: SettingValue}) => {
				Meteor.settings[record._id] = record.value;
				this.dict.set(record._id, record.value);
				this.load(record._id, record.value, initialLoad);
			},
			removed: (record: {_id: string}) => {
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
