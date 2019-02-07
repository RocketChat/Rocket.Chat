import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	RocketChat.settings.addGroup('SMS', function() {
		this.add('SMS_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
		});

		this.add('SMS_Service', 'twilio', {
			type: 'select',
			values: [{
				key: 'twilio',
				i18nLabel: 'Twilio',
			}, {
				key: 'jasmin',
				i18nLabel: 'Jasmin',
			}],
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
			});
			this.add('SMS_Twilio_authToken', '', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'twilio',
				},
				i18nLabel: 'Auth_Token',
			});
		});

		this.section('Jasmin', function() {
			this.add('SMS_Jasmin_gateway_address', '', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'jasmin',
				},
				i18nLabel: 'Jasmin_sms_gateway_address',
				i18nDescription: 'Jasmin_sms_gateway_address_desc',
			});
			this.add('SMS_Jasmin_username', '', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'jasmin',
				},
				i18nLabel: 'Jasmin_sms_gateway_username',
			});
			this.add('SMS_Jasmin_password', '', {
				type: 'string',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'jasmin',
				},
				i18nLabel: 'Jasmin_sms_gateway_password',
			});
			this.add('SMS_Jasmin_from_number', '', {
				type: 'int',
				enableQuery: {
					_id: 'SMS_Service',
					value: 'jasmin',
				},
				i18nLabel: 'Jasmin_sms_gateway_from_number',
				i18nDescription: 'Jasmin_sms_gateway_from_number_desc',
			});
		});

	});
});
