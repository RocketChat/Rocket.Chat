import { Meteor } from 'meteor/meteor';

import { Permissions } from '../../models/server/raw';

Meteor.startup(async () => {
	if (!(await Permissions.findOne({ _id: 'auto-translate' }))) {
		Permissions.create('auto-translate', ['admin']);
	}
});
