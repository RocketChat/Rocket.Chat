import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { CustomUserStatus } from '../../../models/server/raw';
import { api } from '../../../../server/sdk/api';

Meteor.methods({
	async insertOrUpdateUserStatus(userStatusData) {
		if (!hasPermission(this.userId, 'manage-user-status')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(userStatusData.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
				method: 'insertOrUpdateUserStatus',
				field: 'Name',
			});
		}

		// allow all characters except >, <, &, ", '
		// more practical than allowing specific sets of characters; also allows foreign languages
		const nameValidation = /[><&"']/;

		if (nameValidation.test(userStatusData.name)) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${userStatusData.name} is not a valid name`, {
				method: 'insertOrUpdateUserStatus',
				input: userStatusData.name,
				field: 'Name',
			});
		}

		let matchingResults = [];

		if (userStatusData._id) {
			matchingResults = await CustomUserStatus.findByNameExceptId(userStatusData.name, userStatusData._id).toArray();
		} else {
			matchingResults = await CustomUserStatus.findByName(userStatusData.name).toArray();
		}

		if (matchingResults.length > 0) {
			throw new Meteor.Error('Custom_User_Status_Error_Name_Already_In_Use', 'The custom user status name is already in use', {
				method: 'insertOrUpdateUserStatus',
			});
		}

		const validStatusTypes = ['online', 'away', 'busy', 'offline'];
		if (userStatusData.statusType && validStatusTypes.indexOf(userStatusData.statusType) < 0) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${userStatusData.statusType} is not a valid status type`, {
				method: 'insertOrUpdateUserStatus',
				input: userStatusData.statusType,
				field: 'StatusType',
			});
		}

		if (!userStatusData._id) {
			// insert user status
			const createUserStatus = {
				name: userStatusData.name,
				statusType: userStatusData.statusType || null,
			};

			const _id = await (await CustomUserStatus.create(createUserStatus)).insertedId;

			api.broadcast('user.updateCustomStatus', createUserStatus);

			return _id;
		}

		// update User status
		if (userStatusData.name !== userStatusData.previousName) {
			await CustomUserStatus.setName(userStatusData._id, userStatusData.name);
		}

		if (userStatusData.statusType !== userStatusData.previousStatusType) {
			await CustomUserStatus.setStatusType(userStatusData._id, userStatusData.statusType);
		}

		api.broadcast('user.updateCustomStatus', userStatusData);

		return true;
	},
});
