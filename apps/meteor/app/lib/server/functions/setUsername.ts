import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Invites, Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';
import _ from 'underscore';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { RateLimiter } from '../lib';
import { addUserToRoom } from './addUserToRoom';
import { checkUsernameAvailability } from './checkUsernameAvailability';
import { getAvatarSuggestionForUser } from './getAvatarSuggestionForUser';
import { joinDefaultChannels } from './joinDefaultChannels';
import { saveUserIdentity } from './saveUserIdentity';
import { setUserAvatar } from './setUserAvatar';
import { validateUsername } from './validateUsername';
import { callbacks } from '../../../../lib/callbacks';
import { onceTransactionCommitedSuccessfully } from '../../../../server/database/utils';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { notifyOnUserChange } from '../lib/notifyListener';

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

	if (!validateUsername(username)) {
		throw new Meteor.Error(
			'username-invalid',
			`${_.escape(username)} is not a valid username, use only letters, numbers, dots, hyphens and underscores`,
		);
	}

	if (!(await checkUsernameAvailability(username))) {
		throw new Meteor.Error('error-field-unavailable', `<strong>${_.escape(username)}</strong> is already in use :(`, {
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

	void notifyOnUserChange({ clientAction: 'updated', id: user._id, diff: { username } });
};

export const _setUsername = async function (
	userId: string,
	u: string,
	fullUser: IUser,
	updater?: Updater<IUser>,
	session?: ClientSession,
): Promise<unknown> {
	const username = u.trim();

	if (!userId || !username) {
		return false;
	}

	if (!validateUsername(username)) {
		return false;
	}

	const user = fullUser || (await Users.findOneById(userId, { session }));
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
	if (!previousUsername && user.emails && user.emails.length > 0 && settings.get('Accounts_Enrollment_Email')) {
		await onceTransactionCommitedSuccessfully(() => {
			try {
				setImmediate(() => {
					Accounts.sendEnrollmentEmail(user._id);
				});
			} catch (e: any) {
				SystemLogger.error(e);
			}
		}, session);
	}
	// Set new username*
	// TODO: use updater for setting the username and handle possible side effects in addUserToRoom
	await Users.setUsername(user._id, username, { session });
	user.username = username;

	if (!previousUsername && settings.get('Accounts_SetDefaultAvatar') === true) {
		const avatarSuggestions = await getAvatarSuggestionForUser(user);
		let avatarData;
		let serviceName = 'gravatar';

		for (const service of Object.keys(avatarSuggestions)) {
			avatarData = avatarSuggestions[service];
			if (service !== 'gravatar') {
				serviceName = service;
				break;
			}
		}

		if (avatarData) {
			await setUserAvatar(user, avatarData.blob, avatarData.contentType, serviceName, undefined, updater, session);
		}
	}

	await onceTransactionCommitedSuccessfully(async () => {
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
	}, session);

	return user;
};

export const setUsername = RateLimiter.limitFunction(_setUsername, 1, 60000, {
	async 0() {
		const userId = Meteor.userId();
		return !userId || !(await hasPermissionAsync(userId, 'edit-other-user-info'));
	},
});
