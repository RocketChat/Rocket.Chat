import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

Meteor.methods<ServerMethods>({
	setUserActiveStatus(userId, active) {
		Meteor.users.update(userId, { $set: { active } });
		return true;
	},
});
