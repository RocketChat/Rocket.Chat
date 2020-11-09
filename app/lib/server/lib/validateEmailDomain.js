import dns from 'dns';

import { Meteor } from 'meteor/meteor';

import { emailDomainDefaultBlackList } from './defaultBlockedDomainsList';
import { settings } from '../../../settings';

let emailDomainBlackList = [];
let emailDomainWhiteList = [];
let useDefaultBlackList = false;
let useDNSDomainCheck = false;

settings.get('Accounts_BlockedDomainsList', function(key, value) {
	emailDomainBlackList = value.split(',').filter(Boolean).map((domain) => domain.trim());
});
settings.get('Accounts_AllowedDomainsList', function(key, value) {
	emailDomainWhiteList = value.split(',').filter(Boolean).map((domain) => domain.trim());
});
settings.get('Accounts_UseDefaultBlockedDomainsList', function(key, value) {
	useDefaultBlackList = value;
});
settings.get('Accounts_UseDNSDomainCheck', function(key, value) {
	useDNSDomainCheck = value;
});

export const validateEmailDomain = function(email) {
	const emailValidation = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	if (!emailValidation.test(email)) {
		throw new Meteor.Error('error-invalid-email', `Invalid email ${ email }`, { function: 'RocketChat.validateEmailDomain', email });
	}

	const emailDomain = email.substr(email.lastIndexOf('@') + 1);

	if (emailDomainWhiteList.length && !emailDomainWhiteList.includes(emailDomain)) {
		throw new Meteor.Error('error-invalid-domain', 'The email domain is not in whitelist', { function: 'RocketChat.validateEmailDomain' });
	}
	if (emailDomainBlackList.length && (emailDomainBlackList.indexOf(emailDomain) !== -1 || (useDefaultBlackList && emailDomainDefaultBlackList.indexOf(emailDomain) !== -1))) {
		throw new Meteor.Error('error-email-domain-blacklisted', 'The email domain is blacklisted', { function: 'RocketChat.validateEmailDomain' });
	}

	if (useDNSDomainCheck) {
		try {
			Meteor.wrapAsync(dns.resolveMx)(emailDomain);
		} catch (e) {
			throw new Meteor.Error('error-invalid-domain', 'Invalid domain', { function: 'RocketChat.validateEmailDomain' });
		}
	}
};
