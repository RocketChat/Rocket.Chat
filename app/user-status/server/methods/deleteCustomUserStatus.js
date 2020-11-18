import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { CustomUserStatus } from '../../../models/server';
import { api } from '../../../../server/sdk/api';

Meteor.methods({
	deleteCustomUserStatus(userStatusID) {
		if (!hasPermission(this.userId, 'manage-user-status')) {
			throw new Meteor.Error('not_authorized');
		}

		const userStatus = CustomUserStatus.findOneById(userStatusID);
		if (userStatus == null) {
			throw new Meteor.Error('Custom_User_Status_Error_Invalid_User_Status', 'Invalid user status', { method: 'deleteCustomUserStatus' });
		}

		CustomUserStatus.removeById(userStatusID);
		api.broadcast('user.deleteCustomStatus', userStatus);

		return true;
	},
});
