import { Apps, AppEvents } from '@rocket.chat/apps';
import { MeteorError } from '@rocket.chat/core-services';
import { isUserFederated } from '@rocket.chat/core-typings';
import type { IUser, IRole, IUserSettings, RequiredField } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import type { ClientSession } from 'mongodb';

import { callbacks } from '../../../../../lib/callbacks';
import { wrapInSessionTransaction, onceTransactionCommitedSuccessfully } from '../../../../../server/database/utils';
import type { UserChangedAuditStore } from '../../../../../server/lib/auditServerEvents/userChanged';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { safeGetMeteorUser } from '../../../../utils/server/functions/safeGetMeteorUser';
import { generatePassword } from '../../lib/generatePassword';
import { notifyOnUserChange } from '../../lib/notifyListener';
import { passwordPolicy } from '../../lib/passwordPolicy';
import { saveCustomFields } from '../saveCustomFields';
import { saveUserIdentity } from '../saveUserIdentity';
import { setEmail } from '../setEmail';
import { setStatusText } from '../setStatusText';
import { handleBio } from './handleBio';
import { handleNickname } from './handleNickname';
import { saveNewUser } from './saveNewUser';
import { sendPasswordEmail } from './sendUserEmail';
import { setPasswordUpdater } from './setPasswordUpdater';
import { validateUserData } from './validateUserData';
import { validateUserEditing } from './validateUserEditing';
import { shouldBreakInVersion } from '../../../../../server/lib/shouldBreakInVersion';

export type SaveUserData = {
	_id?: IUser['_id'];
	setRandomPassword?: boolean;

	password?: string;
	requirePasswordChange?: boolean;

	username?: string;
	name?: string;

	statusText?: string;
	email?: string;
	verified?: boolean;

	bio?: string;
	nickname?: string;

	roles?: IRole['_id'][];
	settings?: Partial<IUserSettings>;
	language?: string;

	joinDefaultChannels?: boolean;
	sendWelcomeEmail?: boolean;

	customFields?: Record<string, any>;
	active?: boolean;
};
export type UpdateUserData = RequiredField<SaveUserData, '_id'>;
export const isUpdateUserData = (params: SaveUserData): params is UpdateUserData => '_id' in params && !!params._id;

type SaveUserOptions = {
	auditStore?: UserChangedAuditStore;
};

const _saveUser = (session?: ClientSession) =>
	async function (userId: IUser['_id'], userData: SaveUserData, options?: SaveUserOptions) {
		const oldUserData = userData._id && (await Users.findOneById(userData._id));
		if (oldUserData && isUserFederated(oldUserData)) {
			throw new Meteor.Error('Edit_Federated_User_Not_Allowed', 'Not possible to edit a federated user');
		}

		await validateUserData(userId, userData);

		await callbacks.run('beforeSaveUser', {
			user: userData,
			oldUser: oldUserData,
		});

		let sendPassword = false;

		if (userData.hasOwnProperty('setRandomPassword')) {
			if (userData.setRandomPassword) {
				userData.password = generatePassword();
				userData.requirePasswordChange = true;
				sendPassword = true;
			}

			delete userData.setRandomPassword;
		}

		if (!isUpdateUserData(userData)) {
			// TODO audit new users
			return saveNewUser(userData, sendPassword);
		}

		if (!oldUserData) {
			throw new MeteorError('error-user-not-found', 'User not found', {
				method: 'saveUser',
			});
		}

		options?.auditStore?.setOriginalUser(oldUserData);

		await validateUserEditing(userId, userData);

		// update user
		const updater = Users.getUpdater();

		if (userData.hasOwnProperty('username') || userData.hasOwnProperty('name')) {
			if (
				!(await saveUserIdentity({
					_id: userData._id,
					username: userData.username,
					name: userData.name,
					updateUsernameInBackground: true,
					updater,
					session,
				}))
			) {
				throw new Meteor.Error('error-could-not-save-identity', 'Could not save user identity', {
					method: 'saveUser',
				});
			}
		}

		if (typeof userData.statusText === 'string') {
			await setStatusText(userData._id, userData.statusText, updater, session);
		}

		if (userData.email) {
			const shouldSendVerificationEmailToUser = userData.verified !== true;
			await setEmail(userData._id, userData.email, shouldSendVerificationEmailToUser, userData.verified === true, updater);
		}

		if (
			userData.password?.trim() &&
			(await hasPermissionAsync(userId, 'edit-other-user-password')) &&
			passwordPolicy.validate(userData.password)
		) {
			await setPasswordUpdater(updater, userData.password.trim());
		} else {
			sendPassword = false;
		}

		handleBio(updater, userData.bio);
		handleNickname(updater, userData.nickname);

		if (userData.roles) {
			updater.set('roles', userData.roles);
		}
		if (userData.settings) {
			updater.set('settings', { preferences: userData.settings.preferences });
		}

		if (userData.language) {
			updater.set('language', userData.language);
		}

		if (typeof userData.requirePasswordChange !== 'undefined') {
			updater.set('requirePasswordChange', userData.requirePasswordChange);
			if (!userData.requirePasswordChange) {
				updater.unset('requirePasswordChangeReason');
			}
		}

		if (typeof userData.verified === 'boolean') {
			if (oldUserData && 'emails' in oldUserData && oldUserData.emails?.some(({ address }) => address === userData.email)) {
				const index = oldUserData.emails.findIndex(({ address }) => address === userData.email);
				updater.set(`emails.${index}.verified`, userData.verified);
			}
			if (!userData.email) {
				updater.set(`emails.0.verified`, userData.verified);
			}
		}

		if (userData.customFields) {
			await saveCustomFields(userData._id, userData.customFields, { _updater: updater, session });
		}

		await Users.updateFromUpdater({ _id: userData._id }, updater, { session });

		await onceTransactionCommitedSuccessfully(async () => {
			if (session && options?.auditStore) {
				// setting this inside here to avoid moving `executeSetUserActiveStatus` from the endpoint fn
				// updater will be commited by this point, so it won't affect the external user activation/deactivation
				if (userData.active !== undefined) {
					updater.set('active', userData.active);
				}
				options.auditStore.setUpdateFilter(updater.getRawUpdateFilter());
				void options.auditStore.commitAuditEvent();
			}

			// App IPostUserUpdated event hook
			// We need to pass the session here to ensure this record is fetched
			// with the uncommited transaction data.
			const userUpdated = await Users.findOneById(userData._id);

			await callbacks.run('afterSaveUser', {
				user: userUpdated,
				oldUser: oldUserData,
			});

			await Apps.self?.triggerEvent(AppEvents.IPostUserUpdated, {
				user: userUpdated,
				previousUser: oldUserData,
				performedBy: await safeGetMeteorUser(),
			});

			if (sendPassword) {
				await sendPasswordEmail(userData);
			}

			if (typeof userData.verified === 'boolean') {
				delete userData.verified;
			}
			void notifyOnUserChange({
				clientAction: 'updated',
				id: userData._id,
				diff: {
					...userData,
					emails: userUpdated?.emails,
				},
			});
		}, session);

		return true;
	};

const isBroken = shouldBreakInVersion('8.0.0');
export const saveUser = (() => {
	if (isBroken) {
		throw new Error('DEBUG_DISABLE_USER_AUDIT flag is deprecated and should be removed');
	}

	if (!process.env.DEBUG_DISABLE_USER_AUDIT) {
		return wrapInSessionTransaction(_saveUser);
	}

	const saveUserNoSession = _saveUser();
	return function saveUser(userId: IUser['_id'], userData: SaveUserData, _options?: any) {
		return saveUserNoSession(userId, userData);
	};
})();
