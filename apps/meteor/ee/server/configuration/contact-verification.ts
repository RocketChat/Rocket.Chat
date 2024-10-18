import { addSettings } from '../settings/contact-verification';

Meteor.startup(async () => {
	await addSettings();
});
