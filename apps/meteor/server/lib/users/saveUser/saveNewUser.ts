import { StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { handleBio } from './handleBio';
import { handleNickname } from './handleNickname';
import type { SaveUserData } from './saveUser';
import { sendPasswordEmail, sendWelcomeEmail } from './sendUserEmail';
import { getNewUserRoles } from '../../../services/user/lib/getNewUserRoles';
import { createUser } from '../../auth/createUser';
import { triggerPostUserCreated } from '../../auth/triggerPostUserCreated';
import { notifyOnUserChangeById } from '../../notifyListener';
import { validateEmailDomain } from '../../validateEmailDomain';

export const saveNewUser = async function (userData: SaveUserData, sendPassword: boolean, performedBy: IUser) {
	await validateEmailDomain(userData.email);

	const roles = (!!userData.roles && userData.roles.length > 0 && userData.roles) || getNewUserRoles();
	const isGuest = roles?.length === 1 && roles.includes('guest');

	// insert user
	const createUserOptions: Record<string, any> = {
		username: userData.username,
		password: userData.password,
		...(userData.name && { name: userData.name }),
		joinDefaultChannels: userData.joinDefaultChannels,
		isGuest,
		globalRoles: roles,
		skipNewUserRolesSetting: true,
		performedBy,
		// users.create triggers the apps event after its own writes
		skipAppsEngineEvent: true,
	};
	if (userData.email) {
		createUserOptions.email = userData.email;
	}

	const _id = await createUser(createUserOptions);

	try {
		const updater = Users.getUpdater();

		updater.set('settings', userData.settings || {});
		if (typeof userData.name !== 'undefined') {
			updater.set('name', userData.name);
		}

		if (typeof userData.requirePasswordChange !== 'undefined') {
			updater.set('requirePasswordChange', userData.requirePasswordChange);
		}

		if (typeof userData.verified === 'boolean') {
			updater.set('emails.0.verified', userData.verified);
		}

		if (typeof userData.sipExtension === 'string' && userData.sipExtension !== '') {
			updater.set('sipExtension', userData.sipExtension);
		}

		if (userData.presenceDisabledByAdmin) {
			updater.set('presenceDisabledByAdmin', true);
		}

		if (Array.isArray(userData.phones) && userData.phones.length > 0) {
			updater.set('phones', userData.phones);
		}

		handleBio(updater, userData.bio);
		handleNickname(updater, userData.nickname);

		await Users.updateFromUpdater({ _id }, updater);

		if (userData.presenceDisabledByAdmin) {
			void StatusVisibility.invalidate([_id], { allViewers: true });
		}

		if (userData.sendWelcomeEmail) {
			await sendWelcomeEmail(userData);
		}

		if (sendPassword) {
			await sendPasswordEmail(userData);
		}
	} catch (error) {
		// the user exists even though the request fails, so apps still hear about it
		void triggerPostUserCreated(_id, performedBy);
		throw error;
	}

	userData._id = _id;

	void notifyOnUserChangeById({ clientAction: 'inserted', id: _id });

	return _id;
};
