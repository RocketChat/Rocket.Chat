import { Users } from '@rocket.chat/models';
import Gravatar from 'gravatar';

import { getNewUserRoles } from '../../../../../server/services/user/lib/getNewUserRoles';
import { settings } from '../../../../settings/server';
import { notifyOnUserChangeById } from '../../lib/notifyListener';
import { validateEmailDomain } from '../../lib/validateEmailDomain';
import { setUserAvatar } from '../setUserAvatar';
import { handleBio } from './handleBio';
import { handleNickname } from './handleNickname';
import type { SaveUserData } from './saveUser';
import { sendPasswordEmail, sendWelcomeEmail } from './sendUserEmail';

export const saveNewUser = async function (userData: SaveUserData, sendPassword: boolean) {
	await validateEmailDomain(userData.email);

	const roles = (!!userData.roles && userData.roles.length > 0 && userData.roles) || getNewUserRoles();
	const isGuest = roles && roles.length === 1 && roles.includes('guest');

	// insert user
	const createUser: Record<string, any> = {
		username: userData.username,
		password: userData.password,
		joinDefaultChannels: userData.joinDefaultChannels,
		isGuest,
		globalRoles: roles,
		skipNewUserRolesSetting: true,
	};
	if (userData.email) {
		createUser.email = userData.email;
	}

	const _id = await Accounts.createUserAsync(createUser);

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

	handleBio(updater, userData.bio);
	handleNickname(updater, userData.nickname);

	await Users.updateFromUpdater({ _id }, updater);

	if (userData.sendWelcomeEmail) {
		await sendWelcomeEmail(userData);
	}

	if (sendPassword) {
		await sendPasswordEmail(userData);
	}

	userData._id = _id;

	if (settings.get('Accounts_SetDefaultAvatar') === true && userData.email) {
		const gravatarUrl = Gravatar.url(userData.email, {
			default: '404',
			size: '200',
			protocol: 'https',
		});

		try {
			await setUserAvatar({ ...userData, _id }, gravatarUrl, '', 'url');
		} catch (e) {
			// Ignore this error for now, as it not being successful isn't bad
		}
	}

	void notifyOnUserChangeById({ clientAction: 'inserted', id: _id });

	return _id;
};
