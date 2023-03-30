import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { saveCustomFields, passwordPolicy } from '../../app/lib/server';
import { validateUserEditing } from '../../app/lib/server/functions/saveUser';
import { Users } from '../../app/models/server';
import { settings as rcSettings } from '../../app/settings/server';
import { twoFactorRequired } from '../../app/2fa/server/twoFactorRequired';
import { saveUserIdentity } from '../../app/lib/server/functions/saveUserIdentity';
import { compareUserPassword } from '../lib/compareUserPassword';
import { compareUserPasswordHistory } from '../lib/compareUserPasswordHistory';
import { AppEvents, Apps } from '../../ee/server/apps/orchestrator';

async function saveUserProfile(
	this: Meteor.MethodThisType,
	settings: {
		email?: string;
		username?: string;
		realname?: string;
		newPassword?: string;
		statusText?: string;
		statusType?: string;
		bio?: string;
		nickname?: string;
	},
	customFields: Record<string, unknown>,
	..._: unknown[]
) {
	if (!rcSettings.get<boolean>('Accounts_AllowUserProfileChange')) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'saveUserProfile',
		});
	}

	if (!this.userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'saveUserProfile',
		});
	}

	await validateUserEditing(this.userId, {
		_id: this.userId,
		email: settings.email,
		username: settings.username,
		name: settings.realname,
		password: settings.newPassword,
		statusText: settings.statusText,
	});

	const user = Users.findOneById(this.userId);

	if (settings.realname || settings.username) {
		if (
			!(await saveUserIdentity({
				_id: this.userId,
				name: settings.realname,
				username: settings.username,
			}))
		) {
			throw new Meteor.Error('error-could-not-save-identity', 'Could not save user identity', {
				method: 'saveUserProfile',
			});
		}
	}

	if (settings.statusText || settings.statusText === '') {
		await Meteor.callAsync('setUserStatus', null, settings.statusText);
	}

	if (settings.statusType) {
		await Meteor.callAsync('setUserStatus', settings.statusType, null);
	}

	if (settings.bio) {
		if (typeof settings.bio !== 'string' || settings.bio.length > 260) {
			throw new Meteor.Error('error-invalid-field', 'bio', {
				method: 'saveUserProfile',
			});
		}
		Users.setBio(user._id, settings.bio.trim());
	}

	if (settings.nickname) {
		if (typeof settings.nickname !== 'string' || settings.nickname.length > 120) {
			throw new Meteor.Error('error-invalid-field', 'nickname', {
				method: 'saveUserProfile',
			});
		}
		Users.setNickname(user._id, settings.nickname.trim());
	}

	if (settings.email) {
		await Meteor.callAsync('setEmail', settings.email);
	}

	const canChangePasswordForOAuth = rcSettings.get<boolean>('Accounts_AllowPasswordChangeForOAuthUsers');
	if (canChangePasswordForOAuth || user.services?.password) {
		// Should be the last check to prevent error when trying to check password for users without password
		if (settings.newPassword && rcSettings.get<boolean>('Accounts_AllowPasswordChange') === true) {
			// don't let user change to same password
			if (compareUserPassword(user, { plain: settings.newPassword })) {
				throw new Meteor.Error('error-password-same-as-current', 'Entered password same as current password', {
					method: 'saveUserProfile',
				});
			}

			if (user.services?.passwordHistory && !compareUserPasswordHistory(user, { plain: settings.newPassword })) {
				throw new Meteor.Error('error-password-in-history', 'Entered password has been previously used', {
					method: 'saveUserProfile',
				});
			}

			passwordPolicy.validate(settings.newPassword);

			Accounts.setPassword(this.userId, settings.newPassword, {
				logout: false,
			});

			Users.addPasswordToHistory(this.userId, user.services?.password.bcrypt);

			try {
				await Meteor.callAsync('removeOtherTokens');
			} catch (e) {
				Accounts._clearAllLoginTokens(this.userId);
			}
		}
	}

	Users.setProfile(this.userId, {});

	if (customFields && Object.keys(customFields).length) {
		await saveCustomFields(this.userId, customFields);
	}

	// App IPostUserUpdated event hook
	const updatedUser = Users.findOneById(this.userId);
	await Apps.triggerEvent(AppEvents.IPostUserUpdated, { user: updatedUser, previousUser: user });

	return true;
}

const saveUserProfileWithTwoFactor = twoFactorRequired(saveUserProfile, {
	requireSecondFactor: true,
});

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveUserProfile(
			settings: {
				email?: string;
				username?: string;
				realname?: string;
				newPassword?: string;
				statusText?: string;
				statusType?: string;
				bio?: string;
				nickname?: string;
			},
			customFields: Record<string, any>,
			...args: unknown[]
		): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async saveUserProfile(settings, customFields, ...args) {
		check(settings, Object);
		check(customFields, Match.Maybe(Object));

		if (settings.email || settings.newPassword) {
			return saveUserProfileWithTwoFactor.call(this, settings, customFields, ...args);
		}

		return saveUserProfile.call(this, settings, customFields, ...args);
	},
});
