import { Meteor } from 'meteor/meteor';
import { Permissions } from '../../../models';

Meteor.startup(function() {
	const permission = {
		_id: 'mail-messages',
		roles: ['admin'],
	};
	return Permissions.upsert(permission._id, {
		$setOnInsert: permission,
	});
});
