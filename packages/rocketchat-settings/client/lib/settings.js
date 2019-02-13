import { Meteor } from 'meteor/meteor';
import { ReactiveDict } from 'meteor/reactive-dict';
import { CachedCollection } from 'meteor/rocketchat:ui-cached-collection';
import { settings } from '../../lib/settings';

settings.cachedCollection = new CachedCollection({
	name: 'public-settings',
	eventType: 'onAll',
	userRelated: false,
	listenChangesForLoggedUsersOnly: true,
});

settings.collection = settings.cachedCollection.collection;

settings.cachedCollection.init();

settings.dict = new ReactiveDict('settings');

settings.init = function() {
	let initialLoad = true;
	settings.collection.find().observe({
		added(record) {
			Meteor.settings[record._id] = record.value;
			settings.dict.set(record._id, record.value);
			settings.load(record._id, record.value, initialLoad);
		},
		changed(record) {
			Meteor.settings[record._id] = record.value;
			settings.dict.set(record._id, record.value);
			settings.load(record._id, record.value, initialLoad);
		},
		removed(record) {
			delete Meteor.settings[record._id];
			settings.dict.set(record._id, null);
			settings.load(record._id, null, initialLoad);
		},
	});
	initialLoad = false;
};

settings.init();

export { settings };
