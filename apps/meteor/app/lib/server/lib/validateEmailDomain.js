import dns from 'dns';
import util from 'util';

import { validateEmail } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';

import { emailDomainDefaultBlackList } from './defaultBlockedDomainsList';
import { settings } from '../../../settings/server';

const dnsResolveMx = util.promisify(dns.resolveMx);

yarn devlet emailDomainBlackSet = new Set();
let emailDomainWhiteSet = new Set();
let defaultBlackSet = new Set();

// Normalization helper (single source of truth)
const normalize = (domain) => domain.trim().toLowerCase();

// Normalize default blacklist once at startup
defaultBlackSet = new Set(emailDomainDefaultBlackList.map(normalize));

// Watch for admin config changes → normalize at ingestion
settings.watch('Accounts_BlockedDomainsList', (value) => {
	if (!value) {
		emailDomainBlackSet = new Set();
		return;
	}

	emailDomainBlackSet = new Set(
		value
			.split(',')
			.filter(Boolean)
			.map(normalize)
	);
});

settings.watch('Accounts_AllowedDomainsList', (value) => {
	if (!value) {
		emailDomainWhiteSet = new Set();
		return;
	}

	emailDomainWhiteSet = new Set(
		value
			.split(',')
			.filter(Boolean)
			.map(normalize)
	);
});

export const validateEmailDomain = async function (email) {
	// Step 1: Validate basic email format
	if (!validateEmail(email)) {
		throw new Meteor.Error('error-invalid-email', `Invalid email ${email}`, {
			function: 'RocketChat.validateEmailDomain',
			email,
		});
	}

	// Step 2: Extract + normalize domain
	const atIndex = email.lastIndexOf('@');
	if (atIndex === -1) {
		throw new Meteor.Error('error-invalid-email', `Invalid email ${email}`, {
			function: 'RocketChat.validateEmailDomain',
		});
	}

	const emailDomain = normalize(email.slice(atIndex + 1));

	// Step 3: Whitelist enforcement
	if (emailDomainWhiteSet.size > 0 && !emailDomainWhiteSet.has(emailDomain)) {
		throw new Meteor.Error('error-invalid-domain', 'The email domain is not in whitelist', {
			function: 'RocketChat.validateEmailDomain',
		});
	}

	// Step 4: Blacklist enforcement (takes priority)
	if (
		emailDomainBlackSet.size > 0 &&
		(
			emailDomainBlackSet.has(emailDomain) ||
			(
				settings.get('Accounts_UseDefaultBlockedDomainsList') &&
				defaultBlackSet.has(emailDomain)
			)
		)
	) {
		throw new Meteor.Error('error-email-domain-blacklisted', 'The email domain is blacklisted', {
			function: 'RocketChat.validateEmailDomain',
		});
	}

	// Step 5: DNS validation (optional)
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