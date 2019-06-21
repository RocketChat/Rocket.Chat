import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Notifications } from '../../../notifications';
import { CustomUserStatus } from '../../../models';

Meteor.methods({
	insertOrUpdateUserStatus(userStatusData) {
		if (!hasPermission(this.userId, 'manage-user-status')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(userStatusData.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', { method: 'insertOrUpdateUserStatus', field: 'Name' });
		}

		// allow all characters except >, <, &, ", '
		// more practical than allowing specific sets of characters; also allows foreign languages
		const nameValidation = /[><&"']/;

		if (nameValidation.test(userStatusData.name)) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${ userStatusData.name } is not a valid name`, { method: 'insertOrUpdateUserStatus', input: userStatusData.name, field: 'Name' });
		}

		let matchingResults = [];

		if (userStatusData._id) {
			matchingResults = CustomUserStatus.findByNameExceptId(userStatusData.name, userStatusData._id).fetch();
		} else {
			matchingResults = CustomUserStatus.findByName(userStatusData.name).fetch();
		}

		if (matchingResults.length > 0) {
			throw new Meteor.Error('Custom_User_Status_Error_Name_Already_In_Use', 'The custom user status name is already in use', { method: 'insertOrUpdateUserStatus' });
		}

		const validStatusTypes = ['online', 'away', 'busy', 'offline'];
		if (userStatusData.statusType && validStatusTypes.indexOf(userStatusData.statusType) < 0) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${ userStatusData.statusType } is not a valid status type`, { method: 'insertOrUpdateUserStatus', input: userStatusData.statusType, field: 'StatusType' });
		}

		if (!userStatusData._id) {
			// insert user status
			const createUserStatus = {
				name: userStatusData.name,
				statusType: userStatusData.statusType || null,
			};

			const _id = CustomUserStatus.create(createUserStatus);

			Notifications.notifyLogged('updateCustomUserStatus', { userStatusData: createUserStatus });

			return _id;
		}

		// update User status
		if (userStatusData.name !== userStatusData.previousName) {
			CustomUserStatus.setName(userStatusData._id, userStatusData.name);
		}

		if (userStatusData.statusType !== userStatusData.previousStatusType) {
			CustomUserStatus.setStatusType(userStatusData._id, userStatusData.statusType);
		}

		Notifications.notifyLogged('updateCustomUserStatus', { userStatusData });

		return true;
	},
});
