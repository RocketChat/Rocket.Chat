import { api } from '@rocket.chat/core-services';
import { CustomUserStatus } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../lib/authorization/hasPermission';

export const deleteCustomUserStatus = async (userId: string, userStatusID: string): Promise<boolean> => {
	if (!(await hasPermissionAsync(userId, 'manage-user-status'))) {
		throw new Meteor.Error('not_authorized');
	}

	const userStatus = await CustomUserStatus.findOneAndDeleteById(userStatusID);
	if (userStatus == null) {
		throw new Meteor.Error('Custom_User_Status_Error_Invalid_User_Status', 'Invalid user status', { method: 'deleteCustomUserStatus' });
	}

	void api.broadcast('user.deleteCustomStatus', userStatus);

	return true;
};
