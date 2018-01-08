import _ from 'underscore';
import s from 'underscore.string';

Meteor.methods({
	insertOrUpdateUserStatus(userStatusData) {
		if (!RocketChat.authz.hasPermission(this.userId, 'manage-user-status')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(userStatusData.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', { method: 'insertOrUpdateUserStatus', field: 'Name' });
		}
		if (!s.trim(userStatusData.statusType)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Status Type is required', { method: 'insertOrUpdateUserStatus', field: 'StatusType' });
		}

		//allow all characters except >, <, &, ", '
		//more practical than allowing specific sets of characters; also allows foreign languages
		const nameValidation = /[><&"']/;

		if (nameValidation.test(userStatusData.name)) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${ userStatusData.name } is not a valid name`, { method: 'insertOrUpdateUserStatus', input: userStatusData.name, field: 'Name' });
		}

		let matchingResults = [];

		if (userStatusData._id) {
			matchingResults = RocketChat.models.CustomUserStatus.findByNameExceptID(userStatusData.name, userStatusData._id).fetch();
		} else {
			matchingResults = RocketChat.models.CustomUserStatus.findByName(userStatusData.name).fetch();
		}

		if (matchingResults.length > 0) {
			throw new Meteor.Error('Custom_User_Status_Error_Name_Already_In_Use', 'The custom user status name is already in use', { method: 'insertOrUpdateUserStatus' });
		}

		const validStatusTypes = ['online', 'away', 'busy', 'offline'];
		if (validStatusTypes.indexOf(userStatusData.statusType) < 0) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${ userStatusData.statusType } is not a valid status type`, { method: 'insertOrUpdateUserStatus', input: userStatusData.statusType, field: 'StatusType' });
		}

		if (!userStatusData._id) {
			//insert user status
			const createUserStatus = {
				name: userStatusData.name,
				statusType: userStatusData.statusType
			};

			const _id = RocketChat.models.CustomUserStatus.create(createUserStatus);

			RocketChat.Notifications.notifyLogged('updateCustomUserStatus', {userStatusData: createUserStatus});

			return _id;
		} else {
			//update User status
			if (userStatusData.name !== userStatusData.previousName) {
				RocketChat.models.CustomUserStatus.setName(userStatusData._id, userStatusData.name);
			}
			if (userStatusData.statusType !== userStatusData.previousStatusType) {
				RocketChat.models.CustomUserStatus.setStatusType(userStatusData._id, userStatusData.statusType);
			}

			RocketChat.Notifications.notifyLogged('updateCustomUserStatus', {userStatusData});

			return true;
		}
	}
});
