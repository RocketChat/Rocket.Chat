import dns from 'dns';
import util from 'util';

import { Meteor } from 'meteor/meteor';

import { validateEmail } from '../../../../lib/emailValidator';
import { settings } from '../../../settings/server';
import { emailDomainDefaultBlackList } from './defaultBlockedDomainsList';

const dnsResolveMx = util.promisify(dns.resolveMx);

let emailDomainBlackList = [];
let emailDomainWhiteList = [];

settings.watch('Accounts_BlockedDomainsList', (value) => {
	if (!value) {
		emailDomainBlackList = [];
		return;
	}

	emailDomainBlackList = value
		.split(',')
		.filter(Boolean)
		.map((domain) => domain.trim());
});
settings.watch('Accounts_AllowedDomainsList', (value) => {
	if (!value) {
		emailDomainWhiteList = [];
		return;
	}

	emailDomainWhiteList = value
		.split(',')
		.filter(Boolean)
		.map((domain) => domain.trim());
});

export const validateEmailDomain = async function (email) {
	if (!validateEmail(email)) {
		throw new Meteor.Error('error-invalid-email', `Invalid email ${email}`, {
			function: 'RocketChat.validateEmailDomain',
			email,
		});
	}

	const emailDomain = email.substr(email.lastIndexOf('@') + 1);

	if (emailDomainWhiteList.length && !emailDomainWhiteList.includes(emailDomain)) {
		throw new Meteor.Error('error-invalid-domain', 'The email domain is not in whitelist', {
			function: 'RocketChat.validateEmailDomain',
		});
	}
	if (
		emailDomainBlackList.length &&
		(emailDomainBlackList.indexOf(emailDomain) !== -1 ||
			(settings.get('Accounts_UseDefaultBlockedDomainsList') && emailDomainDefaultBlackList.indexOf(emailDomain) !== -1))
	) {
		throw new Meteor.Error('error-email-domain-blacklisted', 'The email domain is blacklisted', {
			function: 'RocketChat.validateEmailDomain',
		});
	}

	if (settings.get('Accounts_UseDNSDomainCheck')) {
		try {
			await dnsResolveMx(emailDomain);
		} catch (e) {
			throw new Meteor.Error('error-invalid-domain', 'Invalid domain', {
				function: 'RocketChat.validateEmailDomain',
			});
		}
	}
};
