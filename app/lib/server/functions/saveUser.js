import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';
import s from 'underscore.string';
import { Gravatar } from 'meteor/jparker:gravatar';

import * as Mailer from '../../../mailer';
import { getRoles, hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import { passwordPolicy } from '../lib/passwordPolicy';
import { validateEmailDomain } from '../lib';
import { validateUserRoles } from '../../../../ee/app/authorization/server/validateUserRoles';
import { getNewUserRoles } from '../../../../server/services/user/lib/getNewUserRoles';
import { saveUserIdentity } from './saveUserIdentity';
import { checkEmailAvailability, checkUsernameAvailability, setUserAvatar, setEmail, setStatusText } from '.';

let html = '';
let passwordChangedHtml = '';
Meteor.startup(() => {
	Mailer.getTemplate('Accounts_UserAddedEmail_Email', (template) => {
		html = template;
	});

	Mailer.getTemplate('Password_Changed_Email', (template) => {
		passwordChangedHtml = template;
	});
});

function _sendUserEmail(subject, html, userData) {
	const email = {
		to: userData.email,
		from: settings.get('From_Email'),
		subject,
		html,
		data: {
			email: userData.email,
			password: userData.password,
		},
	};

	if (typeof userData.name !== 'undefined') {
		email.data.name = userData.name;
	}

	try {
		Mailer.send(email);
	} catch (error) {
		throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ error.message }`, {
			function: 'RocketChat.saveUser',
			message: error.message,
		});
	}
}

function validateUserData(userId, userData) {
	const existingRoles = _.pluck(getRoles(), '_id');

	if (userData._id && userId !== userData._id && !hasPermission(userId, 'edit-other-user-info')) {
		throw new Meteor.Error('error-action-not-allowed', 'Editing user is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Editing_user',
		});
	}

	if (!userData._id && !hasPermission(userId, 'create-user')) {
		throw new Meteor.Error('error-action-not-allowed', 'Adding user is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Adding_user',
		});
	}

	if (userData.roles && _.difference(userData.roles, existingRoles).length > 0) {
		throw new Meteor.Error('error-action-not-allowed', 'The field Roles consist invalid role name', {
			method: 'insertOrUpdateUser',
			action: 'Assign_role',
		});
	}

	if (userData.roles && _.indexOf(userData.roles, 'admin') >= 0 && !hasPermission(userId, 'assign-admin-role')) {
		throw new Meteor.Error('error-action-not-allowed', 'Assigning admin is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Assign_admin',
		});
	}

	if (settings.get('Accounts_RequireNameForSignUp') && !userData._id && !s.trim(userData.name)) {
		throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
			method: 'insertOrUpdateUser',
			field: 'Name',
		});
	}

	if (!userData._id && !s.trim(userData.username)) {
		throw new Meteor.Error('error-the-field-is-required', 'The field Username is required', {
			method: 'insertOrUpdateUser',
			field: 'Username',
		});
	}

	if (userData.roles) {
		validateUserRoles(userId, userData);
	}

	let nameValidation;

	try {
		nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	} catch (e) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}

	if (userData.username && !nameValidation.test(userData.username)) {
		throw new Meteor.Error('error-input-is-not-a-valid-field', `${ _.escape(userData.username) } is not a valid username`, {
			method: 'insertOrUpdateUser',
			input: userData.username,
			field: 'Username',
		});
	}

	if (!userData._id && !userData.password && !userData.setRandomPassword) {
		throw new Meteor.Error('error-the-field-is-required', 'The field Password is required', {
			method: 'insertOrUpdateUser',
			field: 'Password',
		});
	}

	if (!userData._id) {
		if (!checkUsernameAvailability(userData.username)) {
			throw new Meteor.Error('error-field-unavailable', `${ _.escape(userData.username) } is already in use :(`, {
				method: 'insertOrUpdateUser',
				field: userData.username,
			});
		}

		if (userData.email && !checkEmailAvailability(userData.email)) {
			throw new Meteor.Error('error-field-unavailable', `${ _.escape(userData.email) } is already in use :(`, {
				method: 'insertOrUpdateUser',
				field: userData.email,
			});
		}
	}
}

function validateUserEditing(userId, userData) {
	const editingMyself = userData._id && userId === userData._id;

	const canEditOtherUserInfo = hasPermission(userId, 'edit-other-user-info');
	const canEditOtherUserPassword = hasPermission(userId, 'edit-other-user-password');

	if (userData.roles && !hasPermission(userId, 'assign-roles')) {
		throw new Meteor.Error('error-action-not-allowed', 'Assign roles is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Assign_role',
		});
	}

	if (!settings.get('Accounts_AllowUserProfileChange') && !canEditOtherUserInfo && !canEditOtherUserPassword) {
		throw new Meteor.Error('error-action-not-allowed', 'Edit user profile is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (userData.username && !settings.get('Accounts_AllowUsernameChange') && (!canEditOtherUserInfo || editingMyself)) {
		throw new Meteor.Error('error-action-not-allowed', 'Edit username is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (userData.statusText && !settings.get('Accounts_AllowUserStatusMessageChange') && (!canEditOtherUserInfo || editingMyself)) {
		throw new Meteor.Error('error-action-not-allowed', 'Edit user status is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (userData.name && !settings.get('Accounts_AllowRealNameChange') && (!canEditOtherUserInfo || editingMyself)) {
		throw new Meteor.Error('error-action-not-allowed', 'Edit user real name is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (userData.email && !settings.get('Accounts_AllowEmailChange') && (!canEditOtherUserInfo || editingMyself)) {
		throw new Meteor.Error('error-action-not-allowed', 'Edit user email is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (userData.password && !settings.get('Accounts_AllowPasswordChange') && (!canEditOtherUserPassword || editingMyself)) {
		throw new Meteor.Error('error-action-not-allowed', 'Edit user password is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}
}

const handleBio = (updateUser, bio) => {
	if (bio && bio.trim()) {
		if (typeof bio !== 'string' || bio.length > 260) {
			throw new Meteor.Error('error-invalid-field', 'bio', {
				method: 'saveUserProfile',
			});
		}
		updateUser.$set = updateUser.$set || {};
		updateUser.$set.bio = bio;
	} else {
		updateUser.$unset = updateUser.$unset || {};
		updateUser.$unset.bio = 1;
	}
};

const handleNickname = (updateUser, nickname) => {
	if (nickname && nickname.trim()) {
		if (typeof nickname !== 'string' || nickname.length > 120) {
			throw new Meteor.Error('error-invalid-field', 'nickname', {
				method: 'saveUserProfile',
			});
		}
		updateUser.$set = updateUser.$set || {};
		updateUser.$set.nickname = nickname;
	} else {
		updateUser.$unset = updateUser.$unset || {};
		updateUser.$unset.nickname = 1;
	}
};

export const saveUser = function(userId, userData) {
	validateUserData(userId, userData);
	let sendPassword = false;

	if (userData.hasOwnProperty('setRandomPassword')) {
		if (userData.setRandomPassword) {
			userData.password = passwordPolicy.generatePassword();
			userData.requirePasswordChange = true;
			sendPassword = true;
		}

		delete userData.setRandomPassword;
	}

	if (!userData._id) {
		validateEmailDomain(userData.email);

		// insert user
		const createUser = {
			username: userData.username,
			password: userData.password,
			joinDefaultChannels: userData.joinDefaultChannels,
		};
		if (userData.email) {
			createUser.email = userData.email;
		}

		const _id = Accounts.createUser(createUser);

		const updateUser = {
			$set: {
				roles: userData.roles || getNewUserRoles(),
				...typeof userData.name !== 'undefined' && { name: userData.name },
				settings: userData.settings || {},
			},
		};

		if (typeof userData.requirePasswordChange !== 'undefined') {
			updateUser.$set.requirePasswordChange = userData.requirePasswordChange;
		}

		if (typeof userData.verified === 'boolean') {
			updateUser.$set['emails.0.verified'] = userData.verified;
		}

		handleBio(updateUser, userData.bio);
		handleNickname(updateUser, userData.nickname);

		Meteor.users.update({ _id }, updateUser);

		if (userData.sendWelcomeEmail) {
			_sendUserEmail(settings.get('Accounts_UserAddedEmail_Subject'), html, userData);
		}

		if (sendPassword) {
			_sendUserEmail(settings.get('Password_Changed_Email_Subject'), passwordChangedHtml, userData);
		}

		userData._id = _id;

		if (settings.get('Accounts_SetDefaultAvatar') === true && userData.email) {
			const gravatarUrl = Gravatar.imageUrl(userData.email, { default: '404', size: 200, secure: true });

			try {
				setUserAvatar(userData, gravatarUrl, '', 'url');
			} catch (e) {
				// Ignore this error for now, as it not being successful isn't bad
			}
		}

		return _id;
	}

	validateUserEditing(userId, userData);

	// update user
	if (userData.hasOwnProperty('username') || userData.hasOwnProperty('name')) {
		if (!saveUserIdentity({
			_id: userData._id,
			username: userData.username,
			name: userData.name,
		})) {
			throw new Meteor.Error('error-could-not-save-identity', 'Could not save user identity', { method: 'saveUser' });
		}
	}

	if (typeof userData.statusText === 'string') {
		setStatusText(userData._id, userData.statusText);
	}

	if (userData.email) {
		const shouldSendVerificationEmailToUser = userData.verified !== true;
		setEmail(userData._id, userData.email, shouldSendVerificationEmailToUser);
	}

	if (userData.password && userData.password.trim() && hasPermission(userId, 'edit-other-user-password') && passwordPolicy.validate(userData.password)) {
		Accounts.setPassword(userData._id, userData.password.trim());
	} else {
		sendPassword = false;
	}

	const updateUser = {
		$set: {},
	};

	handleBio(updateUser, userData.bio);
	handleNickname(updateUser, userData.nickname);

	if (userData.roles) {
		updateUser.$set.roles = userData.roles;
	}
	if (userData.settings) {
		updateUser.$set.settings = { preferences: userData.settings.preferences };
	}

	if (userData.language) {
		updateUser.$set.language = userData.language;
	}

	if (typeof userData.requirePasswordChange !== 'undefined') {
		updateUser.$set.requirePasswordChange = userData.requirePasswordChange;
	}

	if (typeof userData.verified === 'boolean') {
		updateUser.$set['emails.0.verified'] = userData.verified;
	}

	Meteor.users.update({ _id: userData._id }, updateUser);

	if (sendPassword) {
		_sendUserEmail(settings.get('Password_Changed_Email_Subject'), passwordChangedHtml, userData);
	}

	return true;
};
