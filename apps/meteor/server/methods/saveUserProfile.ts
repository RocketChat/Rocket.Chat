import { PasswordPolicyError } from '@rocket.chat/account-utils';
import type { UserStatus } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { twoFactorRequired } from '../../app/2fa/server/twoFactorRequired';
import { saveCustomFields } from '../../app/lib/server/functions/saveCustomFields';
import { validateUserEditing } from '../../app/lib/server/functions/saveUser';
import { saveUserIdentity } from '../../app/lib/server/functions/saveUserIdentity';
import { passwordPolicy } from '../../app/lib/server/lib/passwordPolicy';
import { settings as rcSettings } from '../../app/settings/server';
import { setUserStatusMethod } from '../../app/user-status/server/methods/setUserStatus';
import { AppEvents, Apps } from '../../ee/server/apps/orchestrator';
import { compareUserPassword } from '../lib/compareUserPassword';
import { compareUserPasswordHistory } from '../lib/compareUserPasswordHistory';

const MAX_BIO_LENGTH = 260;
const MAX_NICKNAME_LENGTH = 120;

// eslint-disable-next-line complexity
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

	const user = await Users.findOneById(this.userId);

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
		await setUserStatusMethod(this.userId, undefined, settings.statusText);
	}

	if (settings.statusType) {
		await setUserStatusMethod(this.userId, settings.statusType as UserStatus, undefined);
	}

	if (user && settings.bio) {
		if (typeof settings.bio !== 'string') {
			throw new Meteor.Error('error-invalid-field', 'bio', {
				method: 'saveUserProfile',
			});
		}
		if (settings.bio.length > MAX_BIO_LENGTH) {
			throw new Meteor.Error('error-bio-size-exceeded', `Bio size exceeds ${MAX_BIO_LENGTH} characters`, {
				method: 'saveUserProfile',
			});
		}
		await Users.setBio(user._id, settings.bio.trim());
	}

	if (user && settings.nickname) {
		if (typeof settings.nickname !== 'string') {
			throw new Meteor.Error('error-invalid-field', 'nickname', {
				method: 'saveUserProfile',
			});
		}
		if (settings.nickname.length > MAX_NICKNAME_LENGTH) {
			throw new Meteor.Error('error-nickname-size-exceeded', `Nickname size exceeds ${MAX_NICKNAME_LENGTH} characters`, {
				method: 'saveUserProfile',
			});
		}
		await Users.setNickname(user._id, settings.nickname.trim());
	}

	if (settings.email) {
		await Meteor.callAsync('setEmail', settings.email);
	}

	const canChangePasswordForOAuth = rcSettings.get<boolean>('Accounts_AllowPasswordChangeForOAuthUsers');
	if (canChangePasswordForOAuth || user?.services?.password) {
		// Should be the last check to prevent error when trying to check password for users without password
		if (settings.newPassword && rcSettings.get<boolean>('Accounts_AllowPasswordChange') === true && user?.services?.password?.bcrypt) {
			// don't let user change to same password
			if (user && (await compareUserPassword(user, { plain: settings.newPassword }))) {
				throw new Meteor.Error('error-password-same-as-current', 'Entered password same as current password', {
					method: 'saveUserProfile',
				});
			}

			if (user?.services?.passwordHistory && !(await compareUserPasswordHistory(user, { plain: settings.newPassword }))) {
				throw new Meteor.Error('error-password-in-history', 'Entered password has been previously used', {
					method: 'saveUserProfile',
				});
			}

			try {
				passwordPolicy.validate(settings.newPassword);
			} catch (err) {
				if (err instanceof PasswordPolicyError) {
					throw new Meteor.Error(err.error, err.message, err.reasons);
				}
				throw err;
			}

			await Accounts.setPasswordAsync(this.userId, settings.newPassword, {
				logout: false,
			});

			await Users.addPasswordToHistory(
				this.userId,
				user.services?.password.bcrypt,
				rcSettings.get<number>('Accounts_Password_History_Amount'),
			);

			try {
				await Meteor.callAsync('removeOtherTokens');
			} catch (e) {
				Accounts._clearAllLoginTokens(this.userId);
			}
		}
	}

	await Users.setProfile(this.userId, {});

	if (customFields && Object.keys(customFields).length) {
		await saveCustomFields(this.userId, customFields);
	}

	// App IPostUserUpdated event hook
	const updatedUser = await Users.findOneById(this.userId);
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
