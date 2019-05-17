import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(function() {
	settings.addGroup('SMS', function() {
		this.add('SMS_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
		});

		this.add('SMS_Service', 'twilio', {
			type: 'select',
			values: [
				{
					key: 'twilio',
					i18nLabel: 'Twilio',
				},
				{
					key: 'voxtelesys',
					i18nLabel: 'Voxtelesys',
				},
			],
			i18nLabel: 'Service',
		});

		this.section('Twilio', function() {
			this.add('SMS_Twilio_Account_SID', '', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'twilio',
				},
				i18nLabel: 'Account_SID',
				secret: true,
			});
			this.add('SMS_Twilio_authToken', '', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'twilio',
				},
				i18nLabel: 'Auth_Token',
				secret: true,
			});
		});

		this.section('Voxtelesys', function() {
			this.add('SMS_Voxtelesys_authToken', '', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'voxtelesys',
				},
				i18nLabel: 'Auth_Token',
			});
			this.add('SMS_Voxtelesys_URL', 'https://smsapi.voxtelesys.net/api/v1/sms', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'voxtelesys',
				},
				i18nLabel: 'URL',
			});
		});
	});
});
