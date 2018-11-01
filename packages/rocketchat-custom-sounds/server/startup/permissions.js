import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	if (RocketChat.models && RocketChat.models.Permissions) {
		RocketChat.models.Permissions.createOrUpdate('manage-sounds', ['admin']);
	}
});
