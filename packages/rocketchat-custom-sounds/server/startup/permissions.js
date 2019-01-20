import { Meteor } from 'meteor/meteor';
import { Permissions } from 'meteor/rocketchat:models';

Meteor.startup(() => {
	if (Permissions) {
		Permissions.createOrUpdate('manage-sounds', ['admin']);
	}
});
