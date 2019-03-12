import { Meteor } from 'meteor/meteor';
import { Permissions } from '/app/models';

Meteor.startup(() => {
	if (Permissions) {
		Permissions.createOrUpdate('manage-sounds', ['admin']);
	}
});
