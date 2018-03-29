import s from 'underscore.string';

RocketChat._setUsername = function(userId, u) {
	const username = s.trim(u);
	if (!userId || !username) {
		return false;
	}
	let nameValidation;
	try {
		nameValidation = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}
	if (!nameValidation.test(username)) {
		return false;
	}
	const user = RocketChat.models.Users.findOneById(userId);
	// User already has desired username, return
	if (user.username === username) {
		return user;
	}
	const previousUsername = user.username;
	// Check username availability or if the user already owns a different casing of the name
	if (!previousUsername || !(username.toLowerCase() === previousUsername.toLowerCase())) {
		if (!RocketChat.checkUsernameAvailability(username)) {
			return false;
		}
	}
	//If first time setting username, send Enrollment Email
	try {
		if (!previousUsername && user.emails && user.emails.length > 0 && RocketChat.settings.get('Accounts_Enrollment_Email')) {
			Accounts.sendEnrollmentEmail(user._id);
		}
	} catch (e) {
		console.error(e);
	}
	/* globals getAvatarSuggestionForUser */
	user.username = username;
	if (!previousUsername && RocketChat.settings.get('Accounts_SetDefaultAvatar') === true) {
		const avatarSuggestions = getAvatarSuggestionForUser(user);
		let gravatar;
		Object.keys(avatarSuggestions).some(service => {
			const avatarData = avatarSuggestions[service];
			if (service !== 'gravatar') {
				RocketChat.setUserAvatar(user, avatarData.blob, avatarData.contentType, service);
				gravatar = null;
				return true;
			} else {
				gravatar = avatarData;
			}
		});
		if (gravatar != null) {
			RocketChat.setUserAvatar(user, gravatar.blob, gravatar.contentType, 'gravatar');
		}
	}
	// Username is available; if coming from old username, update all references
	if (previousUsername) {
		RocketChat.models.Messages.updateAllUsernamesByUserId(user._id, username);
		RocketChat.models.Messages.updateUsernameOfEditByUserId(user._id, username);
		RocketChat.models.Messages.findByMention(previousUsername).forEach(function(msg) {
			const updatedMsg = msg.msg.replace(new RegExp(`@${ previousUsername }`, 'ig'), `@${ username }`);
			return RocketChat.models.Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername(msg._id, previousUsername, username, updatedMsg);
		});
		RocketChat.models.Rooms.replaceUsername(previousUsername, username);
		RocketChat.models.Rooms.replaceMutedUsername(previousUsername, username);
		RocketChat.models.Rooms.replaceUsernameOfUserByUserId(user._id, username);
		RocketChat.models.Subscriptions.setUserUsernameByUserId(user._id, username);
		RocketChat.models.Subscriptions.setNameForDirectRoomsWithOldName(previousUsername, username);

		const fileStore = FileUpload.getStore('Avatars');
		const file = fileStore.model.findOneByName(previousUsername);
		if (file) {
			fileStore.model.updateFileNameById(file._id, username);
		}
	}
	// Set new username*
	RocketChat.models.Users.setUsername(user._id, username);
	return user;
};

RocketChat.setUsername = RocketChat.RateLimiter.limitFunction(RocketChat._setUsername, 1, 60000, {
	[0](userId) {
		return !userId || !RocketChat.authz.hasPermission(userId, 'edit-other-user-info');
	}
});
