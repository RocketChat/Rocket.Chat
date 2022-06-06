import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';
import { escapeRegExp, escapeHTML } from '@rocket.chat/string-helpers';

import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { Settings, Users } from '../../../models/server';
import { Roles, Users as UsersRaw } from '../../../models/server/raw';
import { addUserRoles } from '../../../../server/lib/roles/addUserRoles';
import { getAvatarSuggestionForUser } from '../../../lib/server/functions/getAvatarSuggestionForUser';
import { parseCSV } from '../../../../lib/utils/parseCSV';
import { isValidAttemptByUser, isValidLoginAttemptByIp } from '../lib/restrictLoginAttempts';
import './settings';
import { getClientAddress } from '../../../../server/lib/getClientAddress';
import { getNewUserRoles } from '../../../../server/services/user/lib/getNewUserRoles';
import { AppEvents, Apps } from '../../../apps/server/orchestrator';
import { safeGetMeteorUser } from '../../../utils/server/functions/safeGetMeteorUser';

Accounts.config({
	forbidClientAccountCreation: true,
});

Meteor.startup(() => {
	settings.watchMultiple(['Accounts_LoginExpiration', 'Site_Name', 'From_Email'], () => {
		Accounts._options.loginExpirationInDays = settings.get('Accounts_LoginExpiration');

		Accounts.emailTemplates.siteName = settings.get('Site_Name');

		Accounts.emailTemplates.from = `${settings.get('Site_Name')} <${settings.get('From_Email')}>`;
	});
});

Accounts.emailTemplates.userToActivate = {
	subject() {
		const subject = TAPi18n.__('Accounts_Admin_Email_Approval_Needed_Subject_Default');
		const siteName = settings.get('Site_Name');

		return `[${siteName}] ${subject}`;
	},

	html(options = {}) {
		const email = options.reason
			? 'Accounts_Admin_Email_Approval_Needed_With_Reason_Default'
			: 'Accounts_Admin_Email_Approval_Needed_Default';

		return Mailer.replace(TAPi18n.__(email), {
			name: escapeHTML(options.name),
			email: escapeHTML(options.email),
			reason: escapeHTML(options.reason),
		});
	},
};

Accounts.emailTemplates.userActivated = {
	subject({ active, username }) {
		const activated = username ? 'Activated' : 'Approved';
		const action = active ? activated : 'Deactivated';
		const subject = `Accounts_Email_${action}_Subject`;
		const siteName = settings.get('Site_Name');

		return `[${siteName}] ${TAPi18n.__(subject)}`;
	},

	html({ active, name, username }) {
		const activated = username ? 'Activated' : 'Approved';
		const action = active ? activated : 'Deactivated';

		return Mailer.replace(TAPi18n.__(`Accounts_Email_${action}`), {
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
	return Mailer.replace(verifyEmailTemplate, { Verification_Url: url, name: userModel.name });
};

Accounts.emailTemplates.verifyEmail.subject = function () {
	const subject = settings.get('Verification_Email_Subject');
	return Mailer.replace(subject || '');
};

Accounts.urls.resetPassword = function (token) {
	return Meteor.absoluteUrl(`reset-password/${token}`);
};

Accounts.emailTemplates.resetPassword.subject = function (userModel) {
	return Mailer.replace(settings.get('Forgot_Password_Email_Subject') || '', {
		name: userModel.name,
	});
};

Accounts.emailTemplates.resetPassword.html = function (userModel, url) {
	return Mailer.replacekey(
		Mailer.replace(resetPasswordTemplate, {
			name: userModel.name,
		}),
		'Forgot_Password_Url',
		url,
	);
};

Accounts.emailTemplates.enrollAccount.subject = function (user) {
	const subject = settings.get('Accounts_Enrollment_Email_Subject');
	return Mailer.replace(subject, user);
};

Accounts.emailTemplates.enrollAccount.html = function (user = {} /* , url*/) {
	return Mailer.replace(enrollAccountTemplate, {
		name: escapeHTML(user.name),
		email: user.emails && user.emails[0] && escapeHTML(user.emails[0].address),
	});
};

const getLinkedInName = ({ firstName, lastName }) => {
	const { preferredLocale, localized: firstNameLocalized } = firstName;
	const { localized: lastNameLocalized } = lastName;

	// LinkedIn new format
	if (preferredLocale && firstNameLocalized && preferredLocale.language && preferredLocale.country) {
		const locale = `${preferredLocale.language}_${preferredLocale.country}`;

		if (firstNameLocalized[locale] && lastNameLocalized[locale]) {
			return `${firstNameLocalized[locale]} ${lastNameLocalized[locale]}`;
		}
		if (firstNameLocalized[locale]) {
			return firstNameLocalized[locale];
		}
	}

	// LinkedIn old format
	if (!lastName) {
		return firstName;
	}
	return `${firstName} ${lastName}`;
};

Accounts.onCreateUser(function (options, user = {}) {
	callbacks.run('beforeCreateUser', options, user);

	user.status = 'offline';
	user.active = user.active !== undefined ? user.active : !settings.get('Accounts_ManuallyApproveNewUsers');

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
		const verified = settings.get('Accounts_Verify_Email_For_External_Accounts');

		for (const service of Object.values(user.services)) {
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

	if (!user.active) {
		const destinations = [];
		const usersInRole = Promise.await(Roles.findUsersInRole('admin'));
		Promise.await(usersInRole.toArray()).forEach((adminUser) => {
			if (Array.isArray(adminUser.emails)) {
				adminUser.emails.forEach((email) => {
					destinations.push(`${adminUser.name}<${email.address}>`);
				});
			}
		});

		const email = {
			to: destinations,
			from: settings.get('From_Email'),
			subject: Accounts.emailTemplates.userToActivate.subject(),
			html: Accounts.emailTemplates.userToActivate.html(options),
		};

		Mailer.send(email);
	}

	callbacks.run('onCreateUser', options, user);

	// App IPostUserCreated event hook
	Promise.await(Apps.triggerEvent(AppEvents.IPostUserCreated, { user, performedBy: safeGetMeteorUser() }));

	return user;
});

Accounts.insertUserDoc = _.wrap(Accounts.insertUserDoc, function (insertUserDoc, options, user) {
	const globalRoles = [];

	if (Match.test(user.globalRoles, [String]) && user.globalRoles.length > 0) {
		globalRoles.push(...user.globalRoles);
	}

	delete user.globalRoles;

	if (user.services && !user.services.password) {
		const defaultAuthServiceRoles = parseCSV(settings.get('Accounts_Registration_AuthenticationServices_Default_Roles') || '');

		if (defaultAuthServiceRoles.length > 0) {
			globalRoles.push(...defaultAuthServiceRoles);
		}
	}

	const roles = getNewUserRoles(globalRoles);

	if (!user.type) {
		user.type = 'user';
	}

	if (settings.get('Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In')) {
		user.services = user.services || {};
		user.services.email2fa = {
			enabled: true,
			changedAt: new Date(),
		};
	}

	const _id = insertUserDoc.call(Accounts, options, user);

	user = Meteor.users.findOne({
		_id,
	});

	if (user.username) {
		if (options.joinDefaultChannels !== false && user.joinDefaultChannels !== false) {
			Meteor.runAsUser(_id, function () {
				return Meteor.call('joinDefaultChannels', options.joinDefaultChannelsSilenced);
			});
		}

		if (user.type !== 'visitor') {
			Meteor.defer(function () {
				return callbacks.run('afterCreateUser', user);
			});
		}
		if (settings.get('Accounts_SetDefaultAvatar') === true) {
			const avatarSuggestions = Promise.await(getAvatarSuggestionForUser(user));
			Object.keys(avatarSuggestions).some((service) => {
				const avatarData = avatarSuggestions[service];
				if (service !== 'gravatar') {
					Meteor.runAsUser(_id, function () {
						return Meteor.call('setAvatarFromService', avatarData.blob, '', service);
					});
					return true;
				}

				return false;
			});
		}
	}

	/**
	 * if settings shows setup wizard to be pending
	 * and no admin's been found,
	 * and existing role list doesn't include admin
	 * create this user admin.
	 * count this as the completion of setup wizard step 1.
	 */
	const hasAdmin = Users.findOneByRolesAndType('admin', 'user', { fields: { _id: 1 } });
	if (!roles.includes('admin') && !hasAdmin) {
		roles.push('admin');
		if (settings.get('Show_Setup_Wizard') === 'pending') {
			Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
		}
	}

	addUserRoles(_id, roles);

	return _id;
});

Accounts.validateLoginAttempt(function (login) {
	login = callbacks.run('beforeValidateLogin', login);

	if (!Promise.await(isValidLoginAttemptByIp(getClientAddress(login.connection)))) {
		throw new Meteor.Error('error-login-blocked-for-ip', 'Login has been temporarily blocked For IP', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (!Promise.await(isValidAttemptByUser(login))) {
		throw new Meteor.Error('error-login-blocked-for-user', 'Login has been temporarily blocked For User', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (login.allowed !== true) {
		return login.allowed;
	}

	if (login.user.type === 'visitor') {
		return true;
	}

	if (login.user.type === 'app') {
		throw new Meteor.Error('error-app-user-is-not-allowed-to-login', 'App user is not allowed to login', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (!!login.user.active !== true) {
		throw new Meteor.Error('error-user-is-not-activated', 'User is not activated', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (!login.user.roles || !Array.isArray(login.user.roles)) {
		throw new Meteor.Error('error-user-has-no-roles', 'User has no roles', {
			function: 'Accounts.validateLoginAttempt',
		});
	}

	if (login.user.roles.includes('admin') === false && login.type === 'password' && settings.get('Accounts_EmailVerification') === true) {
		const validEmail = login.user.emails.filter((email) => email.verified === true);
		if (validEmail.length === 0) {
			throw new Meteor.Error('error-invalid-email', 'Invalid email __email__');
		}
	}

	login = callbacks.run('onValidateLogin', login);

	Users.updateLastLoginById(login.user._id);
	Meteor.defer(function () {
		return callbacks.run('afterValidateLogin', login);
	});

	/**
	 * Trigger the event only when the
	 * user does login in Rocket.chat
	 */
	if (login.type !== 'resume') {
		// App IPostUserLoggedIn event hook
		Promise.await(Apps.triggerEvent(AppEvents.IPostUserLoggedIn, login.user));
	}

	return true;
});

Accounts.validateNewUser(function (user) {
	if (user.type === 'visitor') {
		return true;
	}

	if (
		settings.get('Accounts_Registration_AuthenticationServices_Enabled') === false &&
		settings.get('LDAP_Enable') === false &&
		!(user.services && user.services.password)
	) {
		throw new Meteor.Error('registration-disabled-authentication-services', 'User registration is disabled for authentication services');
	}

	return true;
});

Accounts.validateNewUser(function (user) {
	if (user.type === 'visitor') {
		return true;
	}

	let domainWhiteList = settings.get('Accounts_AllowedDomainsList');
	if (_.isEmpty(domainWhiteList?.trim())) {
		return true;
	}

	domainWhiteList = domainWhiteList.split(',').map((domain) => domain.trim());

	if (user.emails && user.emails.length > 0) {
		const email = user.emails[0].address;
		const inWhiteList = domainWhiteList.some((domain) => email.match(`@${escapeRegExp(domain)}$`));

		if (inWhiteList === false) {
			throw new Meteor.Error('error-invalid-domain');
		}
	}

	return true;
});

export const MAX_RESUME_LOGIN_TOKENS = parseInt(process.env.MAX_RESUME_LOGIN_TOKENS) || 50;

Accounts.onLogin(async ({ user }) => {
	if (!user || !user.services || !user.services.resume || !user.services.resume.loginTokens) {
		return;
	}
	if (user.services.resume.loginTokens.length < MAX_RESUME_LOGIN_TOKENS) {
		return;
	}
	const { tokens } = (await UsersRaw.findAllResumeTokensByUserId(user._id))[0];
	if (tokens.length >= MAX_RESUME_LOGIN_TOKENS) {
		const oldestDate = tokens.reverse()[MAX_RESUME_LOGIN_TOKENS - 1];
		Users.removeOlderResumeTokensByUserId(user._id, oldestDate.when);
	}
});
