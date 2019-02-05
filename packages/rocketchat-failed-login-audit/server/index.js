import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.FailedLoginAudit = {
	enabled: false,
	log_useragent: false,
	log_clientip: false,
	log_username: false,
	log_forwarded_for_ip: false,
};

Meteor.startup(function() {
	RocketChat.settings.addGroup('Failed Login Audit', function() {
		this.add('FailedLoginAudit_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
		});
		this.add('FailedLoginAudit_Log_Username', false, {
			type: 'boolean',
			i18nLabel: 'Write user name to logfile',
			enableQuery: { _id: 'FailedLoginAudit_Enabled', value: true },
		}
		);

		this.add('FailedLoginAudit_Log_UserAgent', false, {
			type: 'boolean',
			i18nLabel: 'Write user agent to logfile',
			enableQuery: { _id: 'FailedLoginAudit_Enabled', value: true },
		}
		);

		this.add('FailedLoginAudit_Log_ClientIp', false, {
			type: 'boolean',
			i18nLabel: 'Write client ip to logfile',
			enableQuery: { _id: 'FailedLoginAudit_Enabled', value: true },
		}
		);

		this.add('FailedLoginAudit_Log_ForwardedForIp', false, {
			type: 'boolean',
			i18nLabel: 'Write forwared for ip to logfile',
			enableQuery: { _id: 'FailedLoginAudit_Enabled', value: true },
		}
		);

	});
});

RocketChat.settings.get('FailedLoginAudit_Enabled', function(key, value) {
	RocketChat.FailedLoginAudit.enabled = value;
});

RocketChat.settings.get('FailedLoginAudit_Log_Username', function(key, value) {
	RocketChat.FailedLoginAudit.log_username = value;
});

RocketChat.settings.get('FailedLoginAudit_Log_UserAgent', function(key, value) {
	RocketChat.FailedLoginAudit.log_useragent = value;
});

RocketChat.settings.get('FailedLoginAudit_Log_ClientIp', function(key, value) {
	RocketChat.FailedLoginAudit.log_clientip = value;
});

RocketChat.settings.get('FailedLoginAudit_Log_ForwardedForIp', function(key, value) {
	RocketChat.FailedLoginAudit.log_forwarded_for_ip = value;
});

RocketChat.callbacks.add('beforeValidateLogin', (login) => {

	if (RocketChat.FailedLoginAudit.enabled !== true) {
		return login;
	}

	if (login.allowed !== true) {
		let user = 'unknown';
		if (login.user !== undefined && RocketChat.FailedLoginAudit.log_username === true) {
			user = login.user.username;
		}
		const { connection } = login;
		let { clientAddress } = connection.clientAddress;
		if (RocketChat.FailedLoginAudit.log_clientip !== true) {
			clientAddress = '-';
		}
		let forwardedFor = connection.httpHeaders['x-forwarded-for'];
		if (RocketChat.FailedLoginAudit.log_forwarded_for_ip !== true) {
			forwardedFor = '-';
		}
		let userAgent = connection.httpHeaders['user-agent'];
		if (RocketChat.FailedLoginAudit.log_useragent !== true) {
			userAgent = '-';
		}
		console.log('Failed login detected - Username[%s] ClientAddress[%s] ForwardedFor[%s] UserAgent[%s]', user, clientAddress, forwardedFor, userAgent);
	}

	return login;
});
