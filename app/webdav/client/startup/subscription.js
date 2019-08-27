import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

Tracker.autorun(() => {
	if (Meteor.userId()) {
		Meteor.subscribe('webdavAccounts');
	}
});
