import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { Users } from '@rocket.chat/models';
import { User } from '@rocket.chat/core-services';

import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { isValidAttemptByUser, isValidLoginAttemptByIp } from '../lib/restrictLoginAttempts';
import { getClientAddress } from '../../../../server/lib/getClientAddress';
import { AppEvents, Apps } from '../../../../ee/server/apps/orchestrator';
import { safeHtmlDots } from '../../../../lib/utils/safeHtmlDots';
import { i18n } from '../../../../server/lib/i18n';

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
		const subject = i18n.t('Accounts_Admin_Email_Approval_Needed_Subject_Default');
		const siteName = settings.get('Site_Name');

		return `[${siteName}] ${subject}`;
	},

	html(options = {}) {
		const email = options.reason
			? 'Accounts_Admin_Email_Approval_Needed_With_Reason_Default'
			: 'Accounts_Admin_Email_Approval_Needed_Default';

		return Mailer.replace(i18n.t(email), {
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
	const name = safeHtmlDots(userModel.name);

	return Mailer.replace(verifyEmailTemplate, { Verification_Url: url, name });
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

Accounts.insertUserDoc = function (...args) {
	// Depends on meteor support for Async
	return Promise.await(User.insertUserDoc(...args));
};

const validateLoginAttemptAsync = async function (login) {
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

	login = await callbacks.run('onValidateLogin', login);

	await Users.updateLastLoginById(login.user._id);
	setImmediate(function () {
		return callbacks.run('afterValidateLogin', login);
	});

	/**
	 * Trigger the event only when the
	 * user does login in Rocket.chat
	 */
	if (login.type !== 'resume') {
		// App IPostUserLoggedIn event hook
		await Apps.triggerEvent(AppEvents.IPostUserLoggedIn, login.user);
	}

	return true;
};

Accounts.validateLoginAttempt(function (...args) {
	// Depends on meteor support for Async
	return Promise.await(validateLoginAttemptAsync.call(this, ...args));
});

export const MAX_RESUME_LOGIN_TOKENS = parseInt(process.env.MAX_RESUME_LOGIN_TOKENS) || 50;

Accounts.onLogin(async ({ user }) => {
	if (!user || !user.services || !user.services.resume || !user.services.resume.loginTokens || !user._id) {
		return;
	}

	if (user.services.resume.loginTokens.length < MAX_RESUME_LOGIN_TOKENS) {
		return;
	}

	const { tokens } = (await Users.findAllResumeTokensByUserId(user._id))[0];
	if (tokens.length >= MAX_RESUME_LOGIN_TOKENS) {
		const oldestDate = tokens.reverse()[MAX_RESUME_LOGIN_TOKENS - 1];
		await Users.removeOlderResumeTokensByUserId(user._id, oldestDate.when);
	}
});
