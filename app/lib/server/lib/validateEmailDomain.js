import dns from 'dns';

import { Meteor } from 'meteor/meteor';

import { emailDomainDefaultBlackList } from './defaultBlockedDomainsList';
import { SettingsVersion4 } from '../../../settings/server';

const dnsResolveMx = Meteor.wrapAsync(dns.resolveMx);
const emailValidationRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

let emailDomainBlackList = [];
let emailDomainWhiteList = [];

SettingsVersion4.watch('Accounts_BlockedDomainsList', function(value) {
	if (!value) {
		emailDomainBlackList = [];
		return;
	}

	emailDomainBlackList = value.split(',').filter(Boolean).map((domain) => domain.trim());
});
SettingsVersion4.watch('Accounts_AllowedDomainsList', function(value) {
	if (!value) {
		emailDomainWhiteList = [];
		return;
	}

	emailDomainWhiteList = value.split(',').filter(Boolean).map((domain) => domain.trim());
});

export const validateEmailDomain = function(email) {
	if (!emailValidationRegex.test(email)) {
		throw new Meteor.Error('error-invalid-email', `Invalid email ${ email }`, { function: 'RocketChat.validateEmailDomain', email });
	}

	const emailDomain = email.substr(email.lastIndexOf('@') + 1);

	if (emailDomainWhiteList.length && !emailDomainWhiteList.includes(emailDomain)) {
		throw new Meteor.Error('error-invalid-domain', 'The email domain is not in whitelist', { function: 'RocketChat.validateEmailDomain' });
	}
	if (emailDomainBlackList.length && (emailDomainBlackList.indexOf(emailDomain) !== -1 || (SettingsVersion4.get('Accounts_UseDefaultBlockedDomainsList') && emailDomainDefaultBlackList.indexOf(emailDomain) !== -1))) {
		throw new Meteor.Error('error-email-domain-blacklisted', 'The email domain is blacklisted', { function: 'RocketChat.validateEmailDomain' });
	}

	if (SettingsVersion4.get('Accounts_UseDNSDomainCheck')) {
		try {
			dnsResolveMx(emailDomain);
		} catch (e) {
			throw new Meteor.Error('error-invalid-domain', 'Invalid domain', { function: 'RocketChat.validateEmailDomain' });
		}
	}
};
