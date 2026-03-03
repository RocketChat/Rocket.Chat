import { Apps, AppEvents } from '@rocket.chat/apps';
import { User } from '@rocket.chat/core-services';
import { UserStatus, type IUser } from '@rocket.chat/core-typings';
import { Roles, Settings, Users } from '@rocket.chat/models';
import { escapeRegExp, escapeHTML } from '@rocket.chat/string-helpers';
import { getLoginExpirationInDays } from '@rocket.chat/tools';
import { Accounts } from 'meteor/accounts-base';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { parseCSV } from '../../../../lib/utils/parseCSV';
import { safeHtmlDots } from '../../../../lib/utils/safeHtmlDots';
import { callbacks } from '../../../../server/lib/callbacks';
import { beforeCreateUserCallback } from '../../../../server/lib/callbacks/beforeCreateUserCallback';
import { getClientAddress } from '../../../../server/lib/getClientAddress';
import { getMaxLoginTokens } from '../../../../server/lib/getMaxLoginTokens';
import { i18n } from '../../../../server/lib/i18n';
import { addUserRolesAsync } from '../../../../server/lib/roles/addUserRoles';
import { getNewUserRoles } from '../../../../server/services/user/lib/getNewUserRoles';
import { getAvatarSuggestionForUser } from '../../../lib/server/functions/getAvatarSuggestionForUser';
import { joinDefaultChannels } from '../../../lib/server/functions/joinDefaultChannels';
import { setAvatarFromServiceWithValidation } from '../../../lib/server/functions/setUserAvatar';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';
import { getBaseUserFields } from '../../../utils/server/functions/getBaseUserFields';
import type { ILoginAttempt } from '../ILoginAttempt';
import { isValidAttemptByUser, isValidLoginAttemptByIp } from '../lib/restrictLoginAttempts';

Accounts.config({
	forbidClientAccountCreation: true,
});
/**
 * Accounts calls `_initServerPublications` and holds the `_defaultPublishFields`, without Object.assign its not possible
 * to extend the projection
 *
 * the idea is to send all required fields to the client during login
 * we tried `defaultFieldsSelector` , but it changes all Meteor.userAsync projections which is undesirable
 *
 *
 * we are removing the status here because meteor send 'offline'
 */
Object.assign(Accounts._defaultPublishFields.projection, (({ status: _, ...rest }) => rest)(getBaseUserFields(true)));

Meteor.startup(() => {
	settings.watchMultiple(['Accounts_LoginExpiration', 'Site_Name', 'From_Email'], () => {
		Accounts._options.loginExpirationInDays = getLoginExpirationInDays(settings.get<number>('Accounts_LoginExpiration'));

		Accounts.emailTemplates.siteName = settings.get<string>('Site_Name');

		Accounts.emailTemplates.from = `${settings.get<string>('Site_Name')} <${settings.get<string>('From_Email')}>`;
	});
});

Accounts.emailTemplates.userToActivate = {
	subject() {
		const subject = i18n.t('Accounts_Admin_Email_Approval_Needed_Subject_Default');
		const siteName = settings.get<string>('Site_Name');

		return `[${siteName}] ${subject}`;
	},

	html(options = {}) {
		const email = options.reason
			? 'Accounts_Admin_Email_Approval_Needed_With_Reason_Default'
			: 'Accounts_Admin_Email_Approval_Needed_Default';

		return Mailer.replace(i18n.t(email), {
			name: escapeHTML(options.name ?? ''),
			email: escapeHTML(options.email ?? ''),
			reason: escapeHTML(options.reason ?? ''),
		});
	},
};

Accounts.emailTemplates.userActivated = {
	subject({ active, username }) {
		const activated = username ? 'Activated' : 'Approved';
		const action = active ? activated : 'Deactivated';
		const subject = `Accounts_Email_${action}_Subject`;
		const siteName = settings.get<string>('Site_Name');

		return `[${siteName}] ${i18n.t(subject)}`;
	},

	html({ active, name, username }) {
		const activated = username ? 'Activated' : 'Approved';
		const action = active ? activated : 'Deactivated';

		return Mailer.replace(i18n.t(`Accounts_Email_${action}`), {
			name: escapeHTML(name),
		});
	},
};

let verifyEmailTemplate = '';
let enrollAccountTemplate = '';
let resetPasswordTemplate = '';
Meteor.startup(() => {
	Mailer.getTemplateWrapped('Verification_Email', (value) => {
		verifyEmailTemplate = value;
	});
	Mailer.getTemplateWrapped('Accounts_Enrollment_Email', (value) => {
		enrollAccountTemplate = value;
	});
	Mailer.getTemplateWrapped('Forgot_Password_Email', (value) => {
		resetPasswordTemplate = value;
	});
});

Accounts.emailTemplates.verifyEmail.html = function (userModel, url) {
	const name = safeHtmlDots((userModel as IUser & { name: string }).name);

	return Mailer.replace(verifyEmailTemplate, { Verification_Url: url, name });
};

Accounts.emailTemplates.verifyEmail.subject = function () {
	const subject = settings.get<string>('Verification_Email_Subject');
	return Mailer.replace(subject || '');
};

Accounts.urls.resetPassword = function (token) {
	return Meteor.absoluteUrl(`reset-password/${token}`);
};

Accounts.emailTemplates.resetPassword.subject = function (userModel) {
	return Mailer.replace(settings.get<string>('Forgot_Password_Email_Subject') || '', {
		name: (userModel as IUser & { name: string }).name,
	});
};

Accounts.emailTemplates.resetPassword.html = function (userModel, url) {
	return Mailer.replacekey(
		Mailer.replace(resetPasswordTemplate, {
			name: (userModel as IUser & { name: string }).name,
		}),
		'Forgot_Password_Url',
		url,
	);
};

Accounts.emailTemplates.enrollAccount.subject = function (user) {
	const subject = settings.get<string>('Accounts_Enrollment_Email_Subject');
	return Mailer.replace(subject, user);
};

Accounts.emailTemplates.enrollAccount.html = function (user) {
	return Mailer.replace(enrollAccountTemplate, {
		name: escapeHTML((user as IUser).name ?? ''),
		email: user.emails?.[0] && escapeHTML(user.emails[0].address),
	});
};

type LinkedInName =
	| {
			firstName: {
				preferredLocale?: {
					language: string;
					country: string;
				};
				localized: {
					[locale: string]: string;
				};
			};
			lastName: {
				preferredLocale?: {
					language: string;
					country: string;
				};
				localized: {
					[locale: string]: string;
				};
			};
	  }
	| {
			firstName: string;
			lastName: string;
	  };

const getLinkedInName = ({ firstName, lastName }: LinkedInName): string => {
	// Check if it's the old format (simple strings)
	if (typeof firstName === 'string' && typeof lastName === 'string') {
		return lastName ? `${firstName} ${lastName}` : firstName;
	}

	// LinkedIn new format (objects with localized data)
	if (typeof firstName === 'object' && typeof lastName === 'object') {
		const { preferredLocale, localized: firstNameLocalized } = firstName;
		const { localized: lastNameLocalized } = lastName;

		if (preferredLocale && firstNameLocalized && preferredLocale.language && preferredLocale.country) {
			const locale = `${preferredLocale.language}_${preferredLocale.country}`;

			if (firstNameLocalized[locale] && lastNameLocalized[locale]) {
				return `${firstNameLocalized[locale]} ${lastNameLocalized[locale]}`;
			}
			if (firstNameLocalized[locale]) {
				return firstNameLocalized[locale];
			}
		}
	}

	// Fallback: return empty string or first available value
	return typeof firstName === 'string' ? firstName : '';
};

const validateEmailDomain = (user: Meteor.User) => {
	if ((user as IUser).type === 'visitor') {
		return true;
	}

	const domainWhiteList = settings.get<string>('Accounts_AllowedDomainsList');
	if (_.isEmpty(domainWhiteList?.trim())) {
		return true;
	}

	const domainWhiteListArray = domainWhiteList.split(',').map((domain) => domain.trim());

	if (user.emails && user.emails.length > 0) {
		const email = user.emails[0].address;
		const inWhiteList = domainWhiteListArray.some((domain) => email.match(`@${escapeRegExp(domain)}$`));

		if (!inWhiteList) {
			throw new Meteor.Error('error-invalid-domain');
		}
	}

	return true;
};

const onCreateUserAsync = async function (options: any, user: Meteor.User) {
	if (!options.skipBeforeCreateUserCallback) {
		await beforeCreateUserCallback.run(options, user);
	}

	user.status = UserStatus.OFFLINE;

	user.active = user.active !== undefined ? user.active : !settings.get<boolean>('Accounts_ManuallyApproveNewUsers');
	user.inactiveReason = settings.get<boolean>('Accounts_ManuallyApproveNewUsers') && !user.active ? 'pending_approval' : undefined;

	if (!user.name) {
		if (options.profile) {
			if (options.profile.name) {
				user.name = options.profile.name;
			} else if (options.profile.firstName) {
				// LinkedIn format
				user.name = getLinkedInName(options.profile);
			}
		}
	}

	if (user.services) {
		const verified = settings.get<boolean>('Accounts_Verify_Email_For_External_Accounts');

		for (const service of Object.values(user.services as Meteor.UserServices)) {
			if (!user.name) {
				user.name = service.name || service.username;
			}

			if (!user.emails && service.email) {
				user.emails = [
					{
						address: service.email,
						verified,
					},
				];
			}
		}
	}

	if (!options.skipAdminEmail && !user.active) {
		const destinations: string[] = [];
		const usersInRole = await Roles.findUsersInRole('admin');
		await usersInRole.forEach((adminUser) => {
			if (Array.isArray(adminUser.emails)) {
				adminUser.emails.forEach((email) => {
					destinations.push(`${adminUser.name}<${email.address}>`);
				});
			}
		});

		const email = {
			to: destinations,
			from: settings.get<string>('From_Email'),
			subject: Accounts.emailTemplates.userToActivate.subject(),
			html: Accounts.emailTemplates.userToActivate.html({
				...options,
				name: options.name || options.profile?.name,
				email: options.email || user.emails?.[0].address,
			}),
		};

		await Mailer.send(email);
	}

	if (!options.skipOnCreateUserCallback) {
		await callbacks.run('onCreateUser', options, user);
	}

	if (!options.skipEmailValidation && !validateEmailDomain(user)) {
		throw new Meteor.Error(403, 'User validation failed');
	}

	return user;
};

Accounts.onCreateUser(function (this: typeof Accounts, ...args) {
	// Depends on meteor support for Async
	return onCreateUserAsync.call(this, ...args);
});

const { insertUserDoc } = Accounts;

Accounts.insertUserDoc = async function (options, user) {
	const globalRoles = new Set<string>();

	if (Match.test(options.globalRoles, [String]) && options.globalRoles.length > 0) {
		options.globalRoles.map((role) => globalRoles.add(role));
	}

	if (Match.test(user.globalRoles, [String]) && user.globalRoles.length > 0) {
		user.globalRoles.map((role) => globalRoles.add(role));
	}

	delete user.globalRoles;

	if (user.services && !user.services.password && !options.skipAuthServiceDefaultRoles) {
		const defaultAuthServiceRoles = parseCSV(settings.get<string>('Accounts_Registration_AuthenticationServices_Default_Roles') || '');

		if (defaultAuthServiceRoles.length > 0) {
			defaultAuthServiceRoles.map((role) => globalRoles.add(role));
		}
	}

	const arrayGlobalRoles: string[] = [...globalRoles];
	const roles = options.skipNewUserRolesSetting ? arrayGlobalRoles : getNewUserRoles(arrayGlobalRoles);

	if (!user.type) {
		user.type = 'user';
	}

	if (
		settings.get<boolean>('Accounts_TwoFactorAuthentication_Enabled') &&
		settings.get<boolean>('Accounts_TwoFactorAuthentication_By_Email_Enabled') &&
		settings.get<boolean>('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In')
	) {
		user.services = user.services || {};
		user.services.email2fa = {
			enabled: true,
			changedAt: new Date(),
		};
	}

	// Make sure that the user has the field 'roles'
	if (!user.roles) {
		user.roles = [];
	}

	const _id = await insertUserDoc.call(Accounts, options, user);

	// TODO I believe this find is unnecessary
	user = (await Users.findOne({
		_id,
	})) as Meteor.User & { globalRoles?: string[] };

	/**
	 * if settings shows setup wizard to be pending
	 * and no admin's been found,
	 * and existing role list doesn't include admin
	 * create this user admin.
	 * count this as the completion of setup wizard step 1.
	 */
	if (!options.skipAdminCheck) {
		const hasAdmin = await Users.findOneByRolesAndType('admin', 'user', { projection: { _id: 1 } });
		if (!roles.includes('admin') && !hasAdmin) {
			roles.push('admin');
			if (settings.get<'pending' | 'in_progress' | 'completed'>('Show_Setup_Wizard') === 'pending') {
				// TODO: audit
				(await Settings.updateValueById('Show_Setup_Wizard', 'in_progress')).modifiedCount &&
					void notifyOnSettingChangedById('Show_Setup_Wizard');
			}
		}
	}

	await addUserRolesAsync(_id, roles);

	// Make user's roles to be present on callback
	user = (await Users.findOneById(_id, { projection: { username: 1, type: 1, roles: 1 } })) as Meteor.User & { globalRoles?: string[] };

	if (user.username) {
		if (options.joinDefaultChannels !== false) {
			await joinDefaultChannels(_id, options.joinDefaultChannelsSilenced);
		}

		if (!options.skipAfterCreateUserCallback && user.type !== 'visitor') {
			setImmediate(() => {
				return callbacks.run('afterCreateUser', user);
			});
		}
		if (!options.skipDefaultAvatar && settings.get<boolean>('Accounts_SetDefaultAvatar') === true) {
			const avatarSuggestions = await getAvatarSuggestionForUser(user as IUser);
			for await (const service of Object.keys(avatarSuggestions)) {
				const avatarData = avatarSuggestions[service];
				if (service !== 'gravatar') {
					await setAvatarFromServiceWithValidation(_id, avatarData.blob, '', service);
					break;
				}
			}
		}
	}

	if (!options.skipAppsEngineEvent) {
		// `post` triggered events don't need to wait for the promise to resolve
		Apps.self?.triggerEvent(AppEvents.IPostUserCreated, { user, performedBy: options.performedBy }).catch((e) => {
			Apps.self?.getRocketChatLogger().error({ msg: 'Error while executing post user created event', err: e });
		});
	}

	return _id;
};

const validateLoginAttemptAsync = async function (login: ILoginAttempt) {
	login = await callbacks.run('beforeValidateLogin', login);

	if (!(await isValidLoginAttemptByIp(getClientAddress(login.connection)))) {
		throw new Meteor.Error('error-login-blocked-for-ip', 'Login has been temporarily blocked For IP', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (!(await isValidAttemptByUser(login))) {
		throw new Meteor.Error('error-login-blocked-for-user', 'Login has been temporarily blocked For User', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (login.allowed !== true) {
		return login.allowed;
	}

	if (login.user?.type === 'visitor') {
		return true;
	}

	if (login.user?.type === 'app') {
		throw new Meteor.Error('error-app-user-is-not-allowed-to-login', 'App user is not allowed to login', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (!!login.user?.active !== true) {
		throw new Meteor.Error('error-user-is-not-activated', 'User is not activated', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (!login.user.roles || !Array.isArray(login.user.roles)) {
		throw new Meteor.Error('error-user-has-no-roles', 'User has no roles', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (
		login.user.roles.includes('admin') === false &&
		login.type === 'password' &&
		settings.get<boolean>('Accounts_EmailVerification') === true
	) {
		const validEmail = login.user.emails?.filter((email) => email.verified === true) ?? [];
		if (validEmail.length === 0) {
			throw new Meteor.Error('error-invalid-email', 'Invalid email __email__');
		}
	}

	login = await callbacks.run('onValidateLogin', login);

	await Users.updateLastLoginById(login.user!._id);
	setImmediate(() => {
		return callbacks.run('afterValidateLogin', login);
	});

	/**
	 * Trigger the event only when the
	 * user does login in Rocket.chat
	 */
	if (login.type !== 'resume') {
		// App IPostUserLoggedIn event hook
		await Apps.self?.triggerEvent(AppEvents.IPostUserLoggedIn, login.user);
	}

	return true;
};

Accounts.validateLoginAttempt(function (this: typeof Accounts, ...args: [ILoginAttempt]) {
	// Depends on meteor support for Async
	return validateLoginAttemptAsync.call(this, ...args);
});

Accounts.validateNewUser((user: Meteor.User) => {
	if (user.type === 'visitor') {
		return true;
	}

	if (
		settings.get<boolean>('Accounts_Registration_AuthenticationServices_Enabled') === false &&
		settings.get<boolean>('LDAP_Enable') === false &&
		!user.services?.password
	) {
		throw new Meteor.Error('registration-disabled-authentication-services', 'User registration is disabled for authentication services');
	}

	return true;
});

Accounts.validateNewUser((user: Meteor.User) => {
	if (user.type === 'visitor') {
		return true;
	}

	const domainWhiteList = settings.get<string>('Accounts_AllowedDomainsList');
	if (_.isEmpty(domainWhiteList?.trim())) {
		return true;
	}

	const domainWhiteListArray = domainWhiteList.split(',').map((domain) => domain.trim());

	if (user.emails && user.emails.length > 0) {
		const email = user.emails[0].address;
		const inWhiteList = domainWhiteListArray.some((domain) => email.match(`@${escapeRegExp(domain)}$`));

		if (inWhiteList === false) {
			throw new Meteor.Error('error-invalid-domain');
		}
	}

	return true;
});

Accounts.onLogin(async ({ user }: { user: Meteor.User }) => {
	if (!user?.services?.resume?.loginTokens || !user._id) {
		return;
	}

	if (user.services.resume.loginTokens.length < getMaxLoginTokens()) {
		return;
	}

	await User.ensureLoginTokensLimit(user._id);
});
