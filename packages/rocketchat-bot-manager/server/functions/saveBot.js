import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';
import s from 'underscore.string';
import { getRoles, hasPermission } from 'meteor/rocketchat:authorization';
import { settings } from 'meteor/rocketchat:settings';
import { checkUsernameAvailability, setRealName, setUsername } from 'meteor/rocketchat:lib';

export const saveBot = function(userId, botData) {
	// const bot = models.Users.findOneById(userId);
	const existingRoles = _.pluck(getRoles(), '_id');

	if (botData._id && userId !== botData._id && !hasPermission(userId, 'edit-bot-account')) {
		throw new Meteor.Error('error-action-not-allowed', 'Editing bot is not allowed', {
			method: 'insertOrUpdateBot',
			action: 'Editing_bot',
		});
	}

	if (!botData._id && !hasPermission(userId, 'create-bot-account')) {
		throw new Meteor.Error('error-action-not-allowed', 'Creating bot account is not allowed', {
			method: 'insertOrUpdateBot',
			action: 'Creating_bot',
		});
	}

	if (botData.roles && _.difference(botData.roles, existingRoles).length > 0) {
		throw new Meteor.Error('error-action-not-allowed', 'The field Roles consist invalid role name', {
			method: 'insertOrUpdateBot',
			action: 'Assign_role',
		});
	}

	if (botData.roles && _.indexOf(botData.roles, 'admin') >= 0 && !hasPermission(userId, 'assign-admin-role')) {
		throw new Meteor.Error('error-action-not-allowed', 'Assigning admin is not allowed', {
			method: 'insertOrUpdateBot',
			action: 'Assign_admin',
		});
	}

	if (!botData._id && !s.trim(botData.name)) {
		throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
			method: 'insertOrUpdateBot',
			field: 'Name',
		});
	}

	if (!botData._id && !s.trim(botData.username)) {
		throw new Meteor.Error('error-the-field-is-required', 'The field Username is required', {
			method: 'insertOrUpdateBot',
			field: 'Username',
		});
	}

	let nameValidation;

	try {
		nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	} catch (e) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}

	if (botData.username && !nameValidation.test(botData.username)) {
		throw new Meteor.Error('error-input-is-not-a-valid-field', `${ _.escape(botData.username) } is not a valid username`, {
			method: 'insertOrUpdateBot',
			input: botData.username,
			field: 'Username',
		});
	}

	if (!botData._id && !botData.password) {
		throw new Meteor.Error('error-the-field-is-required', 'The field Password is required', {
			method: 'insertOrUpdateBot',
			field: 'Password',
		});
	}

	if (!botData._id) {
		if (!checkUsernameAvailability(botData.username)) {
			throw new Meteor.Error('error-field-unavailable', `${ _.escape(botData.username) } is already in use :(`, {
				method: 'insertOrUpdateBot',
				field: botData.username,
			});
		}

		// insert bot acc
		const createBot = {
			username: botData.username,
			password: botData.password,
			joinDefaultChannels: botData.joinDefaultChannels,
		};

		const _id = Accounts.createUser(createBot);

		const updateBot = {
			$set: {
				name: botData.name,
				roles: botData.roles || ['bot'],
				type: 'bot',
				settings: botData.settings || {},
			},
		};

		Meteor.users.update({ _id }, updateBot);

		botData._id = _id;

		return _id;
	} else {
		// update bot acc
		if (botData.username) {
			setUsername(botData._id, botData.username);
		}

		if (botData.name) {
			setRealName(botData._id, botData.name);
		}

		if (botData.password && botData.password.trim() && hasPermission(userId, 'edit-other-user-password')) {
			Accounts.setPassword(botData._id, botData.password.trim());
		}

		const updateBot = {
			$set: {},
		};

		if (botData.roles) {
			updateBot.$set.roles = botData.roles;
		}

		if (botData.settings) {
			updateBot.$set.settings = { preferences: botData.settings.preferences };
		}

		Meteor.users.update({ _id: botData._id }, updateBot);

		return true;
	}
};
