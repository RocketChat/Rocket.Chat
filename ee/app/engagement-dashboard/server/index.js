import { Meteor } from 'meteor/meteor';

import { onLicense } from '../../license/server';
import { fillFirstDaysOfMessagesIfNeeded } from './lib/messages';
import { fillFirstDaysOfUsersIfNeeded } from './lib/users';

onLicense('engagement-dashboard', async () => {
	await import('./listeners');
	await import('./api');

	Meteor.startup(async () => {
		const date = new Date();
		fillFirstDaysOfUsersIfNeeded(date);
		fillFirstDaysOfMessagesIfNeeded(date);
	});
});
