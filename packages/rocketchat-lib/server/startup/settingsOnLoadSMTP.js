import _ from 'underscore';

const buildMailURL = _.debounce(function() {
	console.log('Updating process.env.MAIL_URL');

	if (RocketChat.settings.get('SMTP_Host')) {
		process.env.MAIL_URL = `${ RocketChat.settings.get('SMTP_Protocol') }://`;

		if (RocketChat.settings.get('SMTP_Username') && RocketChat.settings.get('SMTP_Password')) {
			process.env.MAIL_URL += `${ encodeURIComponent(RocketChat.settings.get('SMTP_Username')) }:${ encodeURIComponent(RocketChat.settings.get('SMTP_Password')) }@`;
		}

		process.env.MAIL_URL += encodeURIComponent(RocketChat.settings.get('SMTP_Host'));

		if (RocketChat.settings.get('SMTP_Port')) {
			process.env.MAIL_URL += `:${ parseInt(RocketChat.settings.get('SMTP_Port')) }`;
		}

		process.env.MAIL_URL += `?pool=${ RocketChat.settings.get('SMTP_Pool') }`;

		if (RocketChat.settings.get('SMTP_Protocol') === 'smtp' && RocketChat.settings.get('SMTP_IgnoreTLS')) {
			process.env.MAIL_URL += '&secure=false&ignoreTLS=true';
		}

		return process.env.MAIL_URL;
	}
}, 500);

RocketChat.settings.onload('SMTP_Host', function(key, value) {
	if (_.isString(value)) {
		return buildMailURL();
	}
});

RocketChat.settings.onload('SMTP_Port', function() {
	return buildMailURL();
});

RocketChat.settings.onload('SMTP_Username', function(key, value) {
	if (_.isString(value)) {
		return buildMailURL();
	}
});

RocketChat.settings.onload('SMTP_Password', function(key, value) {
	if (_.isString(value)) {
		return buildMailURL();
	}
});

RocketChat.settings.onload('SMTP_Protocol', function() {
	return buildMailURL();
});

RocketChat.settings.onload('SMTP_Pool', function() {
	return buildMailURL();
});

RocketChat.settings.onload('SMTP_IgnoreTLS', function() {
	return buildMailURL();
});

Meteor.startup(function() {
	return buildMailURL();
});
