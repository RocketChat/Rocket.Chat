import _ from 'underscore';
import s from 'underscore.string';

const accountsConfig = {
	forbidClientAccountCreation: true,
	loginExpirationInDays: RocketChat.settings.get('Accounts_LoginExpiration')
};

Accounts.config(accountsConfig);

Accounts.emailTemplates.siteName = RocketChat.settings.get('Site_Name');

Accounts.emailTemplates.from = `${ RocketChat.settings.get('Site_Name') } <${ RocketChat.settings.get('From_Email') }>`;

Accounts.emailTemplates.notifyAdmin = {};

const verifyEmailHtml = Accounts.emailTemplates.verifyEmail.text;

Accounts.emailTemplates.verifyEmail.html = function(user, url) {
	url = url.replace(Meteor.absoluteUrl(), `${ Meteor.absoluteUrl() }login/`);
	return verifyEmailHtml(user, url);
};

const resetPasswordHtml = Accounts.emailTemplates.resetPassword.text;

Accounts.emailTemplates.resetPassword.html = function(user, url) {
	url = url.replace(/\/#\//, '/');
	return resetPasswordHtml(user, url);
};

Accounts.emailTemplates.enrollAccount.subject = function(user = {}) {
	let subject;
	if (RocketChat.settings.get('Accounts_Enrollment_Customized')) {
		subject = RocketChat.settings.get('Accounts_Enrollment_Email_Subject');
	} else {
		subject = TAPi18n.__('Accounts_Enrollment_Email_Subject_Default', {
			lng: user.language || RocketChat.settings.get('language') || 'en'
		});
	}
	return RocketChat.placeholders.replace(subject);
};

Accounts.emailTemplates.enrollAccount.html = function(user = {}/*, url*/) {
	let html;
	if (RocketChat.settings.get('Accounts_Enrollment_Customized')) {
		html = RocketChat.settings.get('Accounts_Enrollment_Email');
	} else {
		html = TAPi18n.__('Accounts_Enrollment_Email_Default', {
			lng: user.language || RocketChat.settings.get('language') || 'en'
		});
	}

	const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
	const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

	html = RocketChat.placeholders.replace(html, {
		name: user.name,
		email: user.emails && user.emails[0] && user.emails[0].address
	});

	return header + html + footer;
};

Accounts.emailTemplates.notifyAdmin.subject = function() {
	const subject = TAPi18n.__('Accounts_Admin_Email_Approval_Needed_Subject_Default');
	const siteName = RocketChat.settings.get('Site_Name');

	return `[${ siteName }] ${ subject }`;
};

Accounts.emailTemplates.notifyAdmin.html = function(options = {}) {
	const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
	const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');

	const email = options.reason ? 'Accounts_Admin_Email_Approval_Needed_With_Reason_Default' : 'Accounts_Admin_Email_Approval_Needed_Default';

	const html = RocketChat.placeholders.replace(TAPi18n.__(email), {
		name: options.name,
		email: options.email,
		reason: options.reason
	});

	return header + html + footer;
};

Accounts.onCreateUser(function(options, user = {}) {
	RocketChat.callbacks.run('beforeCreateUser', options, user);

	user.status = 'offline';
	user.active = !RocketChat.settings.get('Accounts_ManuallyApproveNewUsers');

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
					verified: true
				}];
			}
		}
	}

	if (!user.active) {
		const destinations = [];

		RocketChat.models.Roles.findUsersInRole('admin').forEach(adminUser => {
			if (Array.isArray(adminUser.emails)) {
				adminUser.emails.forEach(address => {
					destinations.push(`${ adminUser.name }<${ address }>`);
				});
			}
		});

		const email = {
			to: destinations,
			from: RocketChat.settings.get('From_Email'),
			subject: Accounts.emailTemplates.notifyAdmin.subject(),
			html: Accounts.emailTemplates.notifyAdmin.html(options)
		};

		Meteor.defer(() => Email.send(email));
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
		const defaultAuthServiceRoles = String(RocketChat.settings.get('Accounts_Registration_AuthenticationServices_Default_Roles')).split(',');
		if (defaultAuthServiceRoles.length > 0) {
			roles = roles.concat(defaultAuthServiceRoles.map(s => s.trim()));
		}
	}

	if (!user.type) {
		user.type = 'user';
	}

	const _id = insertUserDoc.call(Accounts, options, user);

	user = Meteor.users.findOne({
		_id
	});

	if (user.username) {
		if (options.joinDefaultChannels !== false && user.joinDefaultChannels !== false) {
			Meteor.runAsUser(_id, function() {
				return Meteor.call('joinDefaultChannels', options.joinDefaultChannelsSilenced);
			});
		}

		if (user.type !== 'visitor') {
			Meteor.defer(function() {
				return RocketChat.callbacks.run('afterCreateUser', user);
			});
		}
	}

	if (roles.length === 0) {
		const hasAdmin = RocketChat.models.Users.findOne({
			roles: 'admin',
			type: 'user'
		}, {
			fields: {
				_id: 1
			}
		});

		if (hasAdmin) {
			roles.push('user');
		} else {
			roles.push('admin');
		}
	}

	RocketChat.authz.addUserRoles(_id, roles);

	return _id;
});

Accounts.validateLoginAttempt(function(login) {
	login = RocketChat.callbacks.run('beforeValidateLogin', login);

	if (login.allowed !== true) {
		return login.allowed;
	}

	if (login.user.type === 'visitor') {
		return true;
	}

	if (!!login.user.active !== true) {
		throw new Meteor.Error('error-user-is-not-activated', 'User is not activated', {
			'function': 'Accounts.validateLoginAttempt'
		});
	}

	if (!login.user.roles || !Array.isArray(login.user.roles)) {
		throw new Meteor.Error('error-user-has-no-roles', 'User has no roles', {
			'function': 'Accounts.validateLoginAttempt'
		});
	}

	if (login.user.roles.includes('admin') === false && login.type === 'password' && RocketChat.settings.get('Accounts_EmailVerification') === true) {
		const validEmail = login.user.emails.filter(email => email.verified === true);
		if (validEmail.length === 0) {
			throw new Meteor.Error('error-invalid-email', 'Invalid email __email__');
		}
	}

	login = RocketChat.callbacks.run('onValidateLogin', login);

	RocketChat.models.Users.updateLastLoginById(login.user._id);
	Meteor.defer(function() {
		return RocketChat.callbacks.run('afterValidateLogin', login);
	});

	return true;
});

Accounts.validateNewUser(function(user) {
	if (user.type === 'visitor') {
		return true;
	}

	if (RocketChat.settings.get('Accounts_Registration_AuthenticationServices_Enabled') === false && RocketChat.settings.get('LDAP_Enable') === false && !(user.services && user.services.password)) {
		throw new Meteor.Error('registration-disabled-authentication-services', 'User registration is disabled for authentication services');
	}

	return true;
});

Accounts.validateNewUser(function(user) {
	if (user.type === 'visitor') {
		return true;
	}

	let domainWhiteList = RocketChat.settings.get('Accounts_AllowedDomainsList');
	if (_.isEmpty(s.trim(domainWhiteList))) {
		return true;
	}

	domainWhiteList = domainWhiteList.split(',').map(domain => domain.trim());

	if (user.emails && user.emails.length > 0) {
		const email = user.emails[0].address;
		const inWhiteList = domainWhiteList.some(domain => email.match(`@${ RegExp.escape(domain) }$`));

		if (inWhiteList === false) {
			throw new Meteor.Error('error-invalid-domain');
		}
	}

	return true;
});
