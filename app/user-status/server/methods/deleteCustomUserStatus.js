import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Notifications } from '../../../notifications';
import { CustomUserStatus } from '../../../models';

Meteor.methods({
	deleteCustomUserStatus(userStatusID) {
		let userStatus = null;

		if (hasPermission(this.userId, 'manage-user-status')) {
			userStatus = CustomUserStatus.findOneById(userStatusID);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (userStatus == null) {
			throw new Meteor.Error('Custom_User_Status_Error_Invalid_User_Status', 'Invalid user status', { method: 'deleteCustomUserStatus' });
		}

		CustomUserStatus.removeByID(userStatusID);
		Notifications.notifyLogged('deleteCustomUserStatus', { userStatusData: userStatus });

		return true;
	},
});
