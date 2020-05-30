import { SHA256 } from 'meteor/sha';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import ldapEscape from 'ldap-escape';

import { slug, getLdapUsername, getLdapUserUniqueID, syncUserData, addLdapUser } from './sync';
import LDAP from './ldap';
import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import { Logger } from '../../logger';


const logger = new Logger('LDAPHandler', {});

function fallbackDefaultAccountSystem(bind, username, password) {
	if (typeof username === 'string') {
		if (username.indexOf('@') === -1) {
			username = { username };
		} else {
			username = { email: username };
		}
	}

	logger.info('Fallback to default account system', username);

	const loginRequest = {
		user: username,
		password: {
			digest: SHA256(password),
			algorithm: 'sha-256',
		},
	};

	return Accounts._runLoginHandlers(bind, loginRequest);
}

Accounts.registerLoginHandler('ldap', function(loginRequest) {
	if (!loginRequest.ldap || !loginRequest.ldapOptions) {
		return undefined;
	}

	logger.info('Init LDAP login', loginRequest.username);

	if (settings.get('LDAP_Enable') !== true) {
		return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.ldapPass);
	}

	const self = this;
	const ldap = new LDAP();
	let ldapUser;

	const escapedUsername = ldapEscape.filter`${ loginRequest.username }`;

	try {
		ldap.connectSync();
		const users = ldap.searchUsersSync(escapedUsername);

		if (users.length !== 1) {
			logger.info('Search returned', users.length, 'record(s) for', escapedUsername);
			throw new Error('User not Found');
		}

		if (ldap.authSync(users[0].dn, loginRequest.ldapPass) === true) {
			if (ldap.isUserInGroup(escapedUsername, users[0].dn)) {
				ldapUser = users[0];
			} else {
				throw new Error('User not in a valid group');
			}
		} else {
			logger.info('Wrong password for', escapedUsername);
		}
	} catch (error) {
		logger.error(error);
	}

	if (ldapUser === undefined) {
		return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
	}

	// Look to see if user already exists
	let userQuery;

	const Unique_Identifier_Field = getLdapUserUniqueID(ldapUser);
	let user;

	if (Unique_Identifier_Field) {
		userQuery = {
			'services.ldap.id': Unique_Identifier_Field.value,
		};

		logger.info('Querying user');
		logger.debug('userQuery', userQuery);

		user = Meteor.users.findOne(userQuery);
	}

	let username;

	if (settings.get('LDAP_Username_Field') !== '') {
		username = slug(getLdapUsername(ldapUser));
	} else {
		username = slug(loginRequest.username);
	}

	if (!user) {
		userQuery = {
			username,
		};

		logger.debug('userQuery', userQuery);

		user = Meteor.users.findOne(userQuery);
	}

	// Login user if they exist
	if (user) {
		if (user.ldap !== true && settings.get('LDAP_Merge_Existing_Users') !== true) {
			logger.info('User exists without "ldap: true"');
			throw new Meteor.Error('LDAP-login-error', `LDAP Authentication succeeded, but there's already an existing user with provided username [${ username }] in Mongo.`);
		}

		logger.info('Logging user');

		syncUserData(user, ldapUser, ldap);

		if (settings.get('LDAP_Login_Fallback') === true && typeof loginRequest.ldapPass === 'string' && loginRequest.ldapPass.trim() !== '') {
			Accounts.setPassword(user._id, loginRequest.ldapPass, { logout: false });
		}
		logger.info('running afterLDAPLogin');
		callbacks.run('afterLDAPLogin', { user, ldapUser, ldap });
		return {
			userId: user._id,
		};
	}

	logger.info('User does not exist, creating', username);

	if (settings.get('LDAP_Username_Field') === '') {
		username = undefined;
	}

	if (settings.get('LDAP_Login_Fallback') !== true) {
		loginRequest.ldapPass = undefined;
	}

	// Create new user
	const result = addLdapUser(ldapUser, username, loginRequest.ldapPass, ldap);

	if (result instanceof Error) {
		throw result;
	}
	callbacks.run('afterLDAPLogin', { user: result, ldapUser, ldap });

	return result;
});

let LDAP_Enable;
settings.get('LDAP_Enable', (key, value) => {
	if (LDAP_Enable === value) {
		return;
	}
	LDAP_Enable = value;

	if (!value) {
		return callbacks.remove('beforeValidateLogin', 'validateLdapLoginFallback');
	}

	callbacks.add('beforeValidateLogin', (login) => {
		if (!login.allowed) {
			return login;
		}

		// The fallback setting should only block password logins, so users that have other login services can continue using them
		if (login.type !== 'password') {
			return login;
		}

		if (login.user.services && login.user.services.ldap && login.user.services.ldap.id) {
			login.allowed = !!settings.get('LDAP_Login_Fallback');
		}

		return login;
	}, callbacks.priority.MEDIUM, 'validateLdapLoginFallback');
});
