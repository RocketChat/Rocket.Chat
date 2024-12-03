import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../../app/notifications/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		Notifications.bindChannels(`${ Meteor.userId() }/${ Accounts._storedLoginToken() }`, () => {
			console.log('client Notifications.bindChannels');
		});
	});
});
