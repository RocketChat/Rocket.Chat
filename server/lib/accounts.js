import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { TAPi18n } from 'meteor/tap:i18n';
import _ from 'underscore';
import s from 'underscore.string';

import * as Mailer from '../../app/mailer';
import { settings } from '../../app/settings';
import { callbacks } from '../../app/callbacks';
import { Roles, Users, Settings } from '../../app/models';
import { addUserRoles } from '../../app/authorization';
import { getAvatarSuggestionForUser } from '../../app/lib/server/functions';

const accountsConfig = {
	forbidClientAccountCreation: true,
	loginExpirationInDays: settings.get('Accounts_LoginExpiration'),
};

Accounts.config(accountsConfig);

Accounts.emailTemplates.siteName = settings.get('Site_Name');

Accounts.emailTemplates.from = `${ settings.get('Site_Name') } <${ settings.get('From_Email') }>`;

Accounts.emailTemplates.userToActivate = {
	subject() {
		const subject = TAPi18n.__('Accounts_Admin_Email_Approval_Needed_Subject_Default');
		const siteName = settings.get('Site_Name');

		return `[${ siteName }] ${ subject }`;
	},

	html(options = {}) {
		const email = options.reason ? 'Accounts_Admin_Email_Approval_Needed_With_Reason_Default' : 'Accounts_Admin_Email_Approval_Needed_Default';

		return Mailer.replace(TAPi18n.__(email), {
			name: s.escapeHTML(options.name),
			email: s.escapeHTML(options.email),
			reason: s.escapeHTML(options.reason),
		});
	},
};

Accounts.emailTemplates.userActivated = {
	subject({ active, username }) {
		const activated = username ? 'Activated' : 'Approved';
		const action = active ? activated : 'Deactivated';
		const subject = `Accounts_Email_${ action }_Subject`;
		const siteName = settings.get('Site_Name');

		return `[${ siteName }] ${ TAPi18n.__(subject) }`;
	},

	html({ active, name, username }) {
		const activated = username ? 'Activated' : 'Approved';
		const action = active ? activated : 'Deactivated';

		return Mailer.replace(TAPi18n.__(`Accounts_Email_${ action }`), {
			name: s.escapeHTML(name),
		});
	},
};


// const verifyEmailHtml = Accounts.emailTemplates.verifyEmail.html;
let verifyEmailTemplate = '';
let enrollAccountTemplate = '';
Meteor.startup(() => {
	Mailer.getTemplateWrapped('Verification_Email', (value) => {
		verifyEmailTemplate = value;
	});
	Mailer.getTemplateWrapped('Accounts_Enrollment_Email', (value) => {
		enrollAccountTemplate = value;
	});
});
Accounts.emailTemplates.verifyEmail.html = function(user, url) {
	url = url.replace(Meteor.absoluteUrl(), `${ Meteor.absoluteUrl() }login/`);
	return Mailer.replace(verifyEmailTemplate, { Verification_Url: url });
};

Accounts.urls.resetPassword = function(token) {
	return Meteor.absoluteUrl(`reset-password/${ token }`);
};

Accounts.emailTemplates.resetPassword.html = Accounts.emailTemplates.resetPassword.text;

Accounts.emailTemplates.enrollAccount.subject = function(user) {
	const subject = settings.get('Accounts_Enrollment_Email_Subject');
	return Mailer.replace(subject, user);
};

Accounts.emailTemplates.enrollAccount.html = function(user = {}/* , url*/) {
	return Mailer.replace(enrollAccountTemplate, {
		name: s.escapeHTML(user.name),
		email: user.emails && user.emails[0] && s.escapeHTML(user.emails[0].address),
	});
};

Accounts.onCreateUser(function(options, user = {}) {
	callbacks.run('beforeCreateUser', options, user);
	user.status = 'offline';
	user.active = !settings.get('Accounts_ManuallyApproveNewUsers');

	if (options.active !== undefined) {
		user.active = options.active;
	}

	if (!user.name) {
		if (options.profile) {
			if (options.profile.name) {
				user.name = options.profile.name;
			} else if (options.profile.firstName && options.profile.lastName) {
				// LinkedIn format
				user.name = `${ options.profile.firstName } ${ options.profile.lastName }`;
			} else if (options.profile.firstName) {
				// LinkedIn format
				user.name = options.profile.firstName;
			}
		}
	}

	if (user.services) {
		for (const service of Object.values(user.services)) {
			if (!user.name) {
				user.name = service.name || service.username;
			}

			if (!user.emails && service.email) {
				user.emails = [{
					address: service.email,
					verified: true,
				}];
			}
		}
	}

	if (!user.active) {
		const destinations = [];

		Roles.findUsersInRole('admin').forEach((adminUser) => {
			if (Array.isArray(adminUser.emails)) {
				adminUser.emails.forEach((email) => {
					destinations.push(`${ adminUser.name }<${ email.address }>`);
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

	return user;
});

Accounts.insertUserDoc = _.wrap(Accounts.insertUserDoc, function(insertUserDoc, options, user) {
	let roles = [];

	if (Match.test(user.globalRoles, [String]) && user.globalRoles.length > 0) {
		roles = roles.concat(user.globalRoles);
	}

	delete user.globalRoles;

	if (user.services && !user.services.password) {
		const defaultAuthServiceRoles = String(settings.get('Accounts_Registration_AuthenticationServices_Default_Roles')).split(',');
		if (defaultAuthServiceRoles.length > 0) {
			roles = roles.concat(defaultAuthServiceRoles.map((s) => s.trim()));
		}
	}

	if (!user.type) {
		user.type = 'user';
	}

	if (!user.u && options.u) {
		user.u = options.u;
	}

	const _id = insertUserDoc.call(Accounts, options, user);

	user = Meteor.users.findOne({
		_id,
	});

	if (user.username) {
		if (options.joinDefaultChannels !== false && user.joinDefaultChannels !== false) {
			Meteor.runAsUser(_id, function() {
				return Meteor.call('joinDefaultChannels', options.joinDefaultChannelsSilenced);
			});
		}

		if (user.type !== 'visitor') {
			Meteor.defer(function() {
				return callbacks.run('afterCreateUser', user);
			});
		}
		if (settings.get('Accounts_SetDefaultAvatar') === true) {
			const avatarSuggestions = getAvatarSuggestionForUser(user);
			Object.keys(avatarSuggestions).some((service) => {
				const avatarData = avatarSuggestions[service];
				if (service !== 'gravatar') {
					Meteor.runAsUser(_id, function() {
						return Meteor.call('setAvatarFromService', avatarData.blob, '', service);
					});
					return true;
				}

				return false;
			});
		}
	}

	if (roles.length === 0) {
		const hasAdmin = Users.findOne({
			roles: 'admin',
			type: 'user',
		}, {
			fields: {
				_id: 1,
			},
		});

		if (hasAdmin) {
			roles.push('user');
		} else {
			roles.push('admin');
			if (settings.get('Show_Setup_Wizard') === 'pending') {
				Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
			}
		}
	}

	addUserRoles(_id, roles);

	return _id;
});

Accounts.validateLoginAttempt(function(login) {
	login = callbacks.run('beforeValidateLogin', login);

	if (login.allowed !== true) {
		return login.allowed;
	}

	if (login.user.type === 'visitor') {
		return true;
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
	Meteor.defer(function() {
		return callbacks.run('afterValidateLogin', login);
	});

	return true;
});

Accounts.validateNewUser(function(user) {
	if (user.type === 'visitor') {
		return true;
	}

	if (settings.get('Accounts_Registration_AuthenticationServices_Enabled') === false && settings.get('LDAP_Enable') === false && !(user.services && user.services.password)) {
		throw new Meteor.Error('registration-disabled-authentication-services', 'User registration is disabled for authentication services');
	}

	return true;
});

Accounts.validateNewUser(function(user) {
	if (user.type === 'visitor') {
		return true;
	}

	let domainWhiteList = settings.get('Accounts_AllowedDomainsList');
	if (_.isEmpty(s.trim(domainWhiteList))) {
		return true;
	}

	domainWhiteList = domainWhiteList.split(',').map((domain) => domain.trim());

	if (user.emails && user.emails.length > 0) {
		const email = user.emails[0].address;
		const inWhiteList = domainWhiteList.some((domain) => email.match(`@${ RegExp.escape(domain) }$`));

		if (inWhiteList === false) {
			throw new Meteor.Error('error-invalid-domain');
		}
	}

	return true;
});
