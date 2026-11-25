import { ClientSafeError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Roles, Settings, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { escapeRegExp, removeEmpty } from '@rocket.chat/tools';

import { getUserToActivateEmail } from './accountEmails';
import { triggerPostUserCreated } from './triggerPostUserCreated';
import { parseCSV } from '../../../lib/utils/parseCSV';
import { getNewUserRoles } from '../../services/user/lib/getNewUserRoles';
import { settings } from '../../settings';
import { applyCustomOAuthUserFields } from '../auth-providers/custom-oauth/customOAuth';
import { callbacks } from '../callbacks';
import { beforeCreateUserCallback } from '../callbacks/beforeCreateUserCallback';
import * as Mailer from '../notifications/email/api';
import { notifyOnSettingChangedById } from '../notifyListener';
import { addUserRolesAsync } from '../roles/addUserRoles';
import { joinDefaultChannels } from '../rooms/joinDefaultChannels';
import { getAvatarSuggestionForUser } from '../users/getAvatarSuggestionForUser';
import { setAvatarFromServiceWithValidation } from '../users/setUserAvatar';

export type InsertUserOptions = {
	globalRoles?: string[];
	name?: string;
	email?: string;
	reason?: string;
	profile?: { name?: string };
	performedBy?: IUser;
	joinDefaultChannels?: boolean;
	joinDefaultChannelsSilenced?: boolean;
	skipAuthServiceDefaultRoles?: boolean;
	skipNewUserRolesSetting?: boolean;
	skipAdminCheck?: boolean;
	skipAdminEmail?: boolean;
	skipBeforeCreateUserCallback?: boolean;
	skipOnCreateUserCallback?: boolean;
	skipAfterCreateUserCallback?: boolean;
	skipDefaultAvatar?: boolean;
	skipAppsEngineEvent?: boolean;
	[key: string]: unknown;
};

export type NewUser = Partial<Omit<IUser, 'services'>> & {
	// external services (github, cas, custom OAuth…) are stored under their own name, which IUserServices doesn't list
	services?: Record<string, any>;
	globalRoles?: unknown;
};

const collectRoles = (options: InsertUserOptions, user: NewUser): string[] => {
	const globalRoles = new Set<string>();

	for (const roles of [options.globalRoles, user.globalRoles]) {
		if (Array.isArray(roles) && roles.every((role) => typeof role === 'string')) {
			roles.forEach((role) => globalRoles.add(role));
		}
	}

	if (user.services && !user.services.password && !options.skipAuthServiceDefaultRoles) {
		parseCSV(settings.get<string>('Accounts_Registration_AuthenticationServices_Default_Roles') || '').forEach((role) =>
			globalRoles.add(role),
		);
	}

	return options.skipNewUserRolesSetting ? [...globalRoles] : getNewUserRoles([...globalRoles]);
};

const notifyAdminsOfUserToActivate = async (options: InsertUserOptions, user: NewUser) => {
	const destinations: string[] = [];
	const admins = await Roles.findUsersInRole('admin');
	await admins.forEach((admin) => {
		admin.emails?.forEach((email) => destinations.push(`${admin.name}<${email.address}>`));
	});

	await Mailer.send({
		to: destinations,
		from: settings.get<string>('From_Email'),
		...getUserToActivateEmail({
			...options,
			name: options.name || options.profile?.name,
			email: options.email || user.emails?.[0]?.address,
		}),
	});
};

const fillUserDefaults = async (options: InsertUserOptions, user: NewUser): Promise<NewUser> => {
	if (!options.skipBeforeCreateUserCallback) {
		await beforeCreateUserCallback.run(options, user);
	}

	user.status = 'offline' as IUser['status'];
	user.active = user.active !== undefined ? user.active : !settings.get('Accounts_ManuallyApproveNewUsers');
	if (settings.get('Accounts_ManuallyApproveNewUsers') && !user.active) {
		user.inactiveReason = 'pending_approval';
	}

	if (!user.name && options.profile?.name) {
		user.name = options.profile.name;
	}

	if (user.services) {
		const verified = settings.get<boolean>('Accounts_Verify_Email_For_External_Accounts');

		for (const service of Object.values(user.services) as { name?: string; username?: string; email?: string }[]) {
			const suggestedName = service.name || service.username;
			if (!user.name && suggestedName) {
				user.name = suggestedName;
			}

			if (!user.emails && service.email) {
				user.emails = [{ address: service.email, verified }];
			}
		}
	}

	if (!options.skipAdminEmail && !user.active) {
		await notifyAdminsOfUserToActivate(options, user);
	}

	if (!options.skipOnCreateUserCallback) {
		await callbacks.run('onCreateUser', options, user);
	}

	return removeEmpty(user);
};

const validateRegistrationThroughAuthServices = (user: NewUser) => {
	if (
		settings.get('Accounts_Registration_AuthenticationServices_Enabled') === false &&
		settings.get('LDAP_Enable') === false &&
		!user.services?.password
	) {
		throw new ClientSafeError('registration-disabled-authentication-services', 'User registration is disabled for authentication services');
	}
};

const validateEmailDomainAllowList = (user: NewUser) => {
	const allowList = settings.get<string>('Accounts_AllowedDomainsList');
	if (!allowList?.trim()) {
		return;
	}

	const email = user.emails?.[0]?.address;
	if (!email) {
		return;
	}

	const domains = allowList.split(',').map((domain) => domain.trim());
	if (!domains.some((domain) => email.match(`@${escapeRegExp(domain)}$`))) {
		throw new ClientSafeError('error-invalid-domain');
	}
};

const validateNewUser = (user: NewUser) => {
	if (user.type !== 'visitor') {
		validateRegistrationThroughAuthServices(user);
		validateEmailDomainAllowList(user);
	}

	applyCustomOAuthUserFields(user);
};

const insertUserDocument = async (user: NewUser & Pick<IUser, '_id' | 'createdAt'>) => {
	try {
		await Users.insertOne(user as IUser);
	} catch (e) {
		const errmsg = (e as { errmsg?: string } | undefined)?.errmsg;
		if (!errmsg) {
			throw e;
		}
		if (errmsg.includes('emails.address')) {
			throw new ClientSafeError(403, 'Email already exists.');
		}
		if (errmsg.includes('username')) {
			throw new ClientSafeError(403, 'Username already exists.');
		}
		throw e;
	}
};

const makeFirstUserAdmin = async (roles: string[]) => {
	if (roles.includes('admin') || (await Users.findOneByRoleAndType('admin', 'user', { projection: { _id: 1 } }))) {
		return;
	}

	roles.push('admin');
	if (settings.get('Show_Setup_Wizard') === 'pending') {
		// TODO: audit
		(await Settings.updateValueById('Show_Setup_Wizard', 'in_progress')).modifiedCount &&
			void notifyOnSettingChangedById('Show_Setup_Wizard');
	}
};

const setDefaultAvatar = async (user: Pick<IUser, '_id' | 'username' | 'type' | 'roles'>) => {
	const avatarSuggestions = await getAvatarSuggestionForUser(user as IUser);
	const [service] = Object.keys(avatarSuggestions);
	if (service) {
		await setAvatarFromServiceWithValidation(user._id, avatarSuggestions[service].blob, '', service);
	}
};

export async function insertUser(options: InsertUserOptions, newUser: NewUser): Promise<IUser['_id']> {
	const roles = collectRoles(options, newUser);
	const { globalRoles: _globalRoles, ...user } = newUser;

	if (options.name && typeof options.name === 'string') {
		user.name = options.name;
	}

	if (!user.type) {
		user.type = 'user';
	}

	if (
		settings.get('Accounts_TwoFactorAuthentication_Enabled') &&
		settings.get('Accounts_TwoFactorAuthentication_By_Email_Enabled') &&
		settings.get('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In')
	) {
		user.services = user.services || {};
		user.services.email2fa = { enabled: true, changedAt: new Date() };
	}

	if (!user.roles) {
		user.roles = [];
	}

	const fullUser = await fillUserDefaults(options, { createdAt: new Date(), _id: Random.id(), ...user });
	validateNewUser(fullUser);

	const { _id } = fullUser as Pick<IUser, '_id'>;
	await insertUserDocument(fullUser as NewUser & Pick<IUser, '_id' | 'createdAt'>);

	if (!options.skipAdminCheck) {
		await makeFirstUserAdmin(roles);
	}

	await addUserRolesAsync(_id, roles);

	const createdUser = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'type' | 'roles'>>(_id, {
		projection: { username: 1, type: 1, roles: 1 },
	});

	if (createdUser?.username) {
		if (options.joinDefaultChannels !== false) {
			await joinDefaultChannels(_id, options.joinDefaultChannelsSilenced);
		}

		if (!options.skipAfterCreateUserCallback && createdUser.type !== 'visitor') {
			setImmediate(() => callbacks.run('afterCreateUser', createdUser));
		}

		if (!options.skipDefaultAvatar && settings.get('Accounts_SetDefaultAvatar') === true) {
			await setDefaultAvatar(createdUser);
		}
	}

	if (!options.skipAppsEngineEvent) {
		void triggerPostUserCreated(_id, options.performedBy);
	}

	return _id;
}
