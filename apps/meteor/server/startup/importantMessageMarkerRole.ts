import { Meteor } from 'meteor/meteor';
import { Roles } from '@rocket.chat/models';

const ROLE_NAME = 'important-message-marker';

Meteor.startup(async () => {
	await Roles.updateById(
		ROLE_NAME,
		ROLE_NAME,
		'Subscriptions',
		'Role to allow marking messages as important in rooms',
		false,
	);
});
