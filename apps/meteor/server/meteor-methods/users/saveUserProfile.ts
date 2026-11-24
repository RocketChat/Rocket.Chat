import { hashPassword } from '@rocket.chat/account-utils';
import { Apps, AppEvents } from '@rocket.chat/apps';
import { ClientSafeError } from '@rocket.chat/core-services';
import type { IUserPhoneNumber, UserStatus, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import type { UpdateFilter } from 'mongodb';

import { setEmailFunction } from './setEmail';
import { setUserStatusMethod } from './setUserStatus';
import { getUserInfo } from '../../api/lib/getUserInfo';
import { type AuthenticatedContext, twoFactorRequired } from '../../lib/2fa/twoFactorRequired';
import { passwordPolicy } from '../../lib/auth/passwordPolicy';
import { callbacks } from '../../lib/callbacks';
import { compareUserPassword } from '../../lib/compareUserPassword';
import { compareUserPasswordHistory } from '../../lib/compareUserPasswordHistory';
import { notifyOnUserChange } from '../../lib/notifyListener';
import { saveCustomFields } from '../../lib/users/saveCustomFields';
import { validateUserEditing } from '../../lib/users/saveUser';
import { saveUserIdentity } from '../../lib/users/saveUserIdentity';
import { settings as rcSettings } from '../../settings';

const MAX_BIO_LENGTH = 260;
const MAX_NICKNAME_LENGTH = 120;

async function saveUserBio(user: IUser, bio: string | undefined) {
	if (bio || bio === '') {
		if (typeof bio !== 'string') {
			throw new ClientSafeError('error-invalid-field', 'bio', {
				method: 'saveUserProfile',
			});
		}
		if (bio.length > MAX_BIO_LENGTH) {
			throw new ClientSafeError('error-bio-size-exceeded', `Bio size exceeds ${MAX_BIO_LENGTH} characters`, {
				method: 'saveUserProfile',
			});
		}
		await Users.setBio(user._id, bio.trim());
	}
}

async function saveUserNickname(user: IUser, nickname: string | undefined) {
	if (nickname || nickname === '') {
		if (typeof nickname !== 'string') {
			throw new ClientSafeError('error-invalid-field', 'nickname', {
				method: 'saveUserProfile',
			});
		}
		if (nickname.length > MAX_NICKNAME_LENGTH) {
			throw new ClientSafeError('error-nickname-size-exceeded', `Nickname size exceeds ${MAX_NICKNAME_LENGTH} characters`, {
				method: 'saveUserProfile',
			});
		}
		await Users.setNickname(user._id, nickname.trim());
	}
}

async function saveUserPassword(user: IUser, newPassword: string | undefined, unset: UpdateFilter<IUser>, token: string) {
	const canChangePasswordForOAuth = rcSettings.get<boolean>('Accounts_AllowPasswordChangeForOAuthUsers');
	if (canChangePasswordForOAuth || user.services?.password) {
		// Should be the last check to prevent error when trying to check password for users without password
		if (newPassword && rcSettings.get<boolean>('Accounts_AllowPasswordChange') === true && user.services?.password?.bcrypt) {
			// don't let user change to same password
			if (await compareUserPassword(user, { plain: newPassword })) {
				throw new ClientSafeError('error-password-same-as-current', 'Entered password same as current password', {
					method: 'saveUserProfile',
				});
			}

			if (user.services?.passwordHistory && !(await compareUserPasswordHistory(user, { plain: newPassword }))) {
				throw new ClientSafeError('error-password-in-history', 'Entered password has been previously used', {
					method: 'saveUserProfile',
				});
			}

			passwordPolicy.validate(newPassword);

			await Users.setPasswordHash(user._id, await hashPassword(newPassword));

			if (user.requirePasswordChange) {
				await Users.unsetRequirePasswordChange(user._id);
				unset.requirePasswordChange = true;
				unset.requirePasswordChangeReason = true;
			}

			await Users.addPasswordToHistory(
				user._id,
				user.services?.password.bcrypt,
				rcSettings.get<number>('Accounts_Password_History_Amount'),
			);

			try {
				await Users.removeNonLoginTokensExcept(user._id, token);
			} catch (e) {
				await Users.unsetLoginTokens(user._id);
			}
		}
	}
}

async function saveUserProfile(
	this: AuthenticatedContext,
	settings: {
		email?: string;
		username?: string;
		realname?: string;
		newPassword?: string;
		statusText?: string;
		statusType?: string;
		bio?: string;
		nickname?: string;
		phones?: IUserPhoneNumber[];
	},
	customFields: Record<string, unknown>,
	..._: unknown[]
) {
	const unset: UpdateFilter<IUser> = {};
	if (!rcSettings.get<boolean>('Accounts_AllowUserProfileChange')) {
		throw new ClientSafeError('error-not-allowed', 'Not allowed', {
			method: 'saveUserProfile',
		});
	}

	if (!this.userId) {
		throw new ClientSafeError('error-unauthenticated', 'Unauthenticated', {
			method: 'saveUserProfile',
		});
	}

	const username = settings.username || undefined;

	await validateUserEditing(this.userId, {
		_id: this.userId,
		email: settings.email,
		username,
		name: settings.realname,
		password: settings.newPassword,
		statusText: settings.statusText,
	});

	const user = await Users.findOneById(this.userId);

	if (!user) {
		throw new ClientSafeError('error-invalid-user', 'Invalid user', {
			method: 'saveUserProfile',
		});
	}

	// An empty name removes the optional display name; a username can be changed but never removed, so an empty one is ignored.
	if (settings.realname !== undefined || username !== undefined) {
		if (!(await saveUserIdentity({ _id: this.userId, name: settings.realname, username }))) {
			throw new ClientSafeError('error-could-not-save-identity', 'Could not save user identity', {
				method: 'saveUserProfile',
			});
		}
	}

	if (settings.statusType || settings.statusText != null) {
		await setUserStatusMethod(user, settings.statusType as UserStatus, settings.statusText);
	}

	await saveUserBio(user, settings.bio);

	await saveUserNickname(user, settings.nickname);

	if (Array.isArray(settings.phones)) {
		await Users.setPhones(user._id, settings.phones);

		if (settings.phones.length === 0) {
			unset.phones = true;
		}
	}

	if (user && settings.email) {
		await setEmailFunction(settings.email, user);
	}

	await saveUserPassword(user, settings.newPassword, unset, this.token);

	await Users.setProfile(this.userId, {});

	if (customFields && Object.keys(customFields).length) {
		await saveCustomFields(this.userId, customFields);
	}

	// App IPostUserUpdated event hook
	const updatedUser = await Users.findOneById(this.userId);

	// This should never happen, but since `Users.findOneById` might return null, we'll handle it just in case
	if (!updatedUser) {
		throw new Error('Unexpected error after saving user profile: user not found');
	}

	await callbacks.run('afterSaveUser', {
		user: updatedUser,
		oldUser: user,
	});

	void notifyOnUserChange({
		clientAction: 'updated',
		id: updatedUser._id,
		diff: await getUserInfo(updatedUser),
		...(Object.keys(unset).length > 0 && { unset }),
	});

	await Apps.self?.triggerEvent(AppEvents.IPostUserUpdated, { user: updatedUser, previousUser: user });

	return true;
}

const saveUserProfileWithTwoFactor = twoFactorRequired(saveUserProfile, {
	requireSecondFactor: true,
});

declare module '@rocket.chat/ddp-client' {
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
				phones?: IUserPhoneNumber[];
			},
			customFields: Record<string, any>,
			...args: unknown[]
		): boolean;
	}
}

export function executeSaveUserProfile(
	this: AuthenticatedContext,
	user: IUser,
	settings: {
		email?: string;
		username?: string;
		realname?: string;
		newPassword?: string;
		statusText?: string;
		statusType?: string;
		bio?: string;
		nickname?: string;
		phones?: IUserPhoneNumber[];
	},
	customFields: Record<string, any> = {},
	...args: unknown[]
) {
	if (
		(settings.email && user.emails?.length) ||
		(settings.newPassword && Object.keys(user.services || {}).length && !user.requirePasswordChange)
	) {
		return saveUserProfileWithTwoFactor.call(this, settings, customFields, ...args);
	}

	return saveUserProfile.call(this, settings, customFields, ...args);
}
