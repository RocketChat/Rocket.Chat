import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Invites, Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { escapeHtml } from '../../../utils/escapeHtml';
import { RateLimiter } from '../lib';
import { addUserToRoom } from './addUserToRoom';
import { checkUsernameAvailability } from './checkUsernameAvailability';
import { getAvatarSuggestionForUser } from './getAvatarSuggestionForUser';
import { joinDefaultChannels } from './joinDefaultChannels';
import { saveUserIdentity } from './saveUserIdentity';
import { setUserAvatar } from './setUserAvatar';

export const setUsernameWithValidation = async (userId: string, username: string, joinDefaultChannelsSilenced?: boolean): Promise<void> => {
	if (!username) {
		throw new Meteor.Error('error-invalid-username', 'Invalid username', { method: 'setUsername' });
	}

	const user = await Users.findOneById(userId);

	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setUsername' });
	}

	if (user.username && !settings.get('Accounts_AllowUsernameChange')) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed');
	}

	if (user.username === username || (user.username && user.username.toLowerCase() === username.toLowerCase())) {
		return;
	}

	let nameValidation;
	try {
		nameValidation = new RegExp(`^${settings.get('UTF8_User_Names_Validation')}$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}

	if (!nameValidation.test(username)) {
		throw new Meteor.Error(
			'username-invalid',
			`${escapeHtml(username)} is not a valid username, use only letters, numbers, dots, hyphens and underscores`,
		);
	}

	if (!(await checkUsernameAvailability(username))) {
		throw new Meteor.Error('error-field-unavailable', `<strong>${escapeHtml(username)}</strong> is already in use :(`, {
			method: 'setUsername',
			field: username,
		});
	}

	if (!(await saveUserIdentity({ _id: user._id, username }))) {
		throw new Meteor.Error('error-could-not-change-username', 'Could not change username', {
			method: 'setUsername',
		});
	}

	if (!user.username) {
		await joinDefaultChannels(user._id, joinDefaultChannelsSilenced);
		setImmediate(async () => callbacks.run('afterCreateUser', user));
	}
};

export const _setUsername = async function (userId: string, u: string, fullUser: IUser): Promise<unknown> {
	const username = u.trim();
	if (!userId || !username) {
		return false;
	}
	let nameValidation;
	try {
		nameValidation = new RegExp(`^${settings.get('UTF8_User_Names_Validation')}$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}
	if (!nameValidation.test(username)) {
		return false;
	}
	const user = fullUser || (await Users.findOneById(userId));
	// User already has desired username, return
	if (user.username === username) {
		return user;
	}
	const previousUsername = user.username;
	// Check username availability or if the user already owns a different casing of the name
	if (!previousUsername || !(username.toLowerCase() === previousUsername.toLowerCase())) {
		if (!(await checkUsernameAvailability(username))) {
			return false;
		}
	}
	// If first time setting username, send Enrollment Email
	try {
		if (!previousUsername && user.emails && user.emails.length > 0 && settings.get('Accounts_Enrollment_Email')) {
			setImmediate(() => {
				Accounts.sendEnrollmentEmail(user._id);
			});
		}
	} catch (e: any) {
		SystemLogger.error(e);
	}
	// Set new username*
	await Users.setUsername(user._id, username);
	user.username = username;
	if (!previousUsername && settings.get('Accounts_SetDefaultAvatar') === true) {
		// eslint-disable-next-line @typescript-eslint/ban-types
		const avatarSuggestions = (await getAvatarSuggestionForUser(user)) as {};
		let gravatar;
		for await (const service of Object.keys(avatarSuggestions)) {
			const avatarData = avatarSuggestions[+service as keyof typeof avatarSuggestions];
			if (service !== 'gravatar') {
				// eslint-disable-next-line dot-notation
				await setUserAvatar(user, avatarData['blob'], avatarData['contentType'], service);
				gravatar = null;
				break;
			}
			gravatar = avatarData;
		}
		if (gravatar != null) {
			// eslint-disable-next-line dot-notation
			await setUserAvatar(user, gravatar['blob'], gravatar['contentType'], 'gravatar');
		}
	}

	// If it's the first username and the user has an invite Token, then join the invite room
	if (!previousUsername && user.inviteToken) {
		const inviteData = await Invites.findOneById(user.inviteToken);
		if (inviteData?.rid) {
			await addUserToRoom(inviteData.rid, user);
		}
	}

	void api.broadcast('user.nameChanged', {
		_id: user._id,
		name: user.name,
		username: user.username,
	});

	return user;
};

export const setUsername = RateLimiter.limitFunction(_setUsername, 1, 60000, {
	async 0() {
		const userId = Meteor.userId();
		return !userId || !(await hasPermissionAsync(userId, 'edit-other-user-info'));
	},
});
