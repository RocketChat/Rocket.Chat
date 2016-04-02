const dns = Npm.require('dns');

var emailDomainBlackList = [];
var emailDomainWhiteList = [];
var useDefaultBlackList = false;
var useDNSDomainCheck = false;

RocketChat.settings.get('Accounts_BlockedDomainsList', function(key, value) {
	emailDomainBlackList = _.map(value.split(','), (domain) => domain.trim());
});
RocketChat.settings.get('Accounts_AllowedDomainsList', function(key, value) {
	emailDomainWhiteList = _.map(value.split(','), (domain) => domain.trim());
});
RocketChat.settings.get('Accounts_UseDefaultBlockedDomainsList', function(key, value) {
	useDefaultBlackList = value;
});
RocketChat.settings.get('Accounts_UseDNSDomainCheck', function(key, value) {
	useDNSDomainCheck = value;
});

RocketChat.validateEmailDomain = function(email) {
	const emailValidation = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	if (!emailValidation.test(email)) {
		throw new Meteor.Error('email-invalid', email + ' is not a valid e-mail');
	}

	const emailDomain = email.substr(email.lastIndexOf('@') + 1);

	// if not in whitelist
	if (emailDomainWhiteList.indexOf(emailDomain) === -1) {
		if (emailDomainBlackList.indexOf(emailDomain) !== -1 || (useDefaultBlackList && RocketChat.emailDomainDefaultBlackList.indexOf(emailDomain) !== -1)) {
			throw new Meteor.Error('email-domain-blacklisted', 'Email domain backlisted');
		}
	}

	if (useDNSDomainCheck) {
		try {
			Meteor.wrapAsync(dns.resolveMx)(emailDomain);
		} catch (e) {
			throw new Meteor.Error('invalid-email', 'Invalid domain');
		}
	}
};
