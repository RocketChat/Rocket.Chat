import { Apps, AppEvents } from '@rocket.chat/apps';
import { isUserFederated } from '@rocket.chat/core-typings';
import type { IUser, IRole, IUserSettings, RequiredField } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { safeGetMeteorUser } from '../../../../utils/server/functions/safeGetMeteorUser';
import { generatePassword } from '../../lib/generatePassword';
import { notifyOnUserChange } from '../../lib/notifyListener';
import { passwordPolicy } from '../../lib/passwordPolicy';
import { saveUserIdentity } from '../saveUserIdentity';
import { setEmail } from '../setEmail';
import { setStatusText } from '../setStatusText';
import { handleBio } from './handleBio';
import { handleNickname } from './handleNickname';
import { saveNewUser } from './saveNewUser';
import { sendPasswordEmail } from './sendUserEmail';
import { validateUserData } from './validateUserData';
import { validateUserEditing } from './validateUserEditing';

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
};
export type UpdateUserData = RequiredField<SaveUserData, '_id'>;
export const isUpdateUserData = (params: SaveUserData): params is UpdateUserData => '_id' in params && !!params._id;

export const saveUser = async function (userId: IUser['_id'], userData: SaveUserData) {
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
		return saveNewUser(userData, sendPassword);
	}

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
			}))
		) {
			throw new Meteor.Error('error-could-not-save-identity', 'Could not save user identity', {
				method: 'saveUser',
			});
		}
	}

	if (typeof userData.statusText === 'string') {
		await setStatusText(userData._id, userData.statusText, updater);
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
		await Accounts.setPasswordAsync(userData._id, userData.password.trim());
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

	if (typeof userData.verified === 'boolean' && !userData.email) {
		updater.set('emails.0.verified', userData.verified);
	}

	await Users.updateFromUpdater({ _id: userData._id }, updater);

	// App IPostUserUpdated event hook
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

	return true;
};
