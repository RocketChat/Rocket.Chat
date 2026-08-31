import type { IUser } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Users } from '@rocket.chat/models';
import Gravatar from 'gravatar';
import { Accounts } from 'meteor/accounts-base';

import { notifyOnUserChangeById } from '../../notifyListener';
import { validateEmailDomain } from '../../validateEmailDomain';
import { warnGravatarDeprecation } from '../gravatarDeprecation';
import { setUserAvatar } from '../setUserAvatar';
import { handleBio } from './handleBio';
import { handleNickname } from './handleNickname';
import type { SaveUserData } from './saveUser';
import { sendPasswordEmail, sendWelcomeEmail } from './sendUserEmail';
import { getNewUserRoles } from '../../../services/user/lib/getNewUserRoles';
import { settings } from '../../../settings';

export const saveNewUser = async function (userData: SaveUserData, sendPassword: boolean, performedBy: IUser) {
	await validateEmailDomain(userData.email);

	const roles = (!!userData.roles && userData.roles.length > 0 && userData.roles) || getNewUserRoles();
	const isGuest = roles?.length === 1 && roles.includes('guest');

	// insert user
	const createUser: Record<string, any> = {
		username: userData.username,
		password: userData.password,
		...(userData.name && { name: userData.name }),
		joinDefaultChannels: userData.joinDefaultChannels,
		isGuest,
		globalRoles: roles,
		skipNewUserRolesSetting: true,
		performedBy,
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

	if (typeof userData.freeSwitchExtension === 'string' && userData.freeSwitchExtension !== '') {
		updater.set('freeSwitchExtension', userData.freeSwitchExtension);
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

	// Offline (air-gapped) licenses suppress the default Gravatar fetch — a
	// default-on outbound call the workspace must never initiate on its own.
	if (settings.get('Accounts_SetDefaultAvatar') === true && userData.email && !License.hasOfflineLicense()) {
		warnGravatarDeprecation();

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
