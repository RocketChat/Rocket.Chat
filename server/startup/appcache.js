import { Meteor } from 'meteor/meteor';

if (Meteor.AppCache) {
	Meteor.AppCache.config({
		onlineOnly: ['/elements/', '/landing/', '/moment-locales/', '/scripts/'],
	});
}
