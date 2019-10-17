import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { Accounts } from 'meteor/accounts-base';

import { FileUpload } from '../../../file-upload';
import { settings } from '../../../settings';
import { Users, Messages, Subscriptions, Rooms, LivechatDepartmentAgents } from '../../../models';
import { hasPermission } from '../../../authorization';
import { RateLimiter } from '../lib';
import { Notifications } from '../../../notifications/server';

import { checkUsernameAvailability, setUserAvatar, getAvatarSuggestionForUser } from '.';

export const _setUsername = function(userId, u) {
	const username = s.trim(u);
	if (!userId || !username) {
		return false;
	}
	let nameValidation;
	try {
		nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}
	if (!nameValidation.test(username)) {
		return false;
	}
	const user = Users.findOneById(userId);
	// User already has desired username, return
	if (user.username === username) {
		return user;
	}
	const previousUsername = user.username;
	// Check username availability or if the user already owns a different casing of the name
	if (!previousUsername || !(username.toLowerCase() === previousUsername.toLowerCase())) {
		if (!checkUsernameAvailability(username)) {
			return false;
		}
	}
	// If first time setting username, send Enrollment Email
	try {
		if (!previousUsername && user.emails && user.emails.length > 0 && settings.get('Accounts_Enrollment_Email')) {
			Accounts.sendEnrollmentEmail(user._id);
		}
	} catch (e) {
		console.error(e);
	}
	// Set new username*
	Users.setUsername(user._id, username);
	user.username = username;
	if (!previousUsername && settings.get('Accounts_SetDefaultAvatar') === true) {
		const avatarSuggestions = getAvatarSuggestionForUser(user);
		let gravatar;
		Object.keys(avatarSuggestions).some((service) => {
			const avatarData = avatarSuggestions[service];
			if (service !== 'gravatar') {
				setUserAvatar(user, avatarData.blob, avatarData.contentType, service);
				gravatar = null;
				return true;
			}
			gravatar = avatarData;
			return false;
		});
		if (gravatar != null) {
			setUserAvatar(user, gravatar.blob, gravatar.contentType, 'gravatar');
		}
	}
	// Username is available; if coming from old username, update all references
	if (previousUsername) {
		Messages.updateAllUsernamesByUserId(user._id, username);
		Messages.updateUsernameOfEditByUserId(user._id, username);
		Messages.findByMention(previousUsername).forEach(function(msg) {
			const updatedMsg = msg.msg.replace(new RegExp(`@${ previousUsername }`, 'ig'), `@${ username }`);
			return Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername(msg._id, previousUsername, username, updatedMsg);
		});
		Rooms.replaceUsername(previousUsername, username);
		Rooms.replaceMutedUsername(previousUsername, username);
		Rooms.replaceUsernameOfUserByUserId(user._id, username);
		Subscriptions.setUserUsernameByUserId(user._id, username);
		Subscriptions.setNameForDirectRoomsWithOldName(previousUsername, username);
		LivechatDepartmentAgents.replaceUsernameOfAgentByUserId(user._id, username);

		const fileStore = FileUpload.getStore('Avatars');
		const file = fileStore.model.findOneByName(previousUsername);
		if (file) {
			fileStore.model.updateFileNameById(file._id, username);
		}
	}

	Notifications.notifyLogged('Users:NameChanged', {
		_id: user._id,
		name: user.name,
		username: user.username,
	});

	return user;
};

export const setUsername = RateLimiter.limitFunction(_setUsername, 1, 60000, {
	0() {
		return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info');
	},
});
