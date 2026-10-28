import { Permissions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
	if (!(await Permissions.findOne({ _id: 'auto-translate' }))) {
		await Permissions.create('auto-translate', ['admin']);
	}
});
