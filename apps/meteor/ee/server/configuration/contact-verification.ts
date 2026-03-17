import { Meteor } from 'meteor/meteor';

import { addSettings } from '../settings/contact-verification';

Meteor.startup(async () => {
	await addSettings();
});
