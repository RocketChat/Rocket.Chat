import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { getWorkspaceAccessToken } from '../../app/cloud/server';
import { hasRole } from '../../app/authorization';
import { settings } from '../../app/settings';
import { appTokensCollection, Push } from '../../app/push/server';


Meteor.methods({
	push_test() {
		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'push_test',
			});
		}

		if (!hasRole(user._id, 'admin')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'push_test',
			});
		}

		if (settings.get('Push_enable') !== true) {
			throw new Meteor.Error('error-push-disabled', 'Push is disabled', {
				method: 'push_test',
			});
		}

		const query = {
			$and: [{
				userId: user._id,
			}, {
				$or: [{
					'token.apn': {
						$exists: true,
					},
				}, {
					'token.gcm': {
						$exists: true,
					},
				}],
			}],
		};

		const tokens = appTokensCollection.find(query).count();

		if (tokens === 0) {
			throw new Meteor.Error('error-no-tokens-for-this-user', 'There are no tokens for this user', {
				method: 'push_test',
			});
		}

		Push.send({
			from: 'push',
			title: `@${ user.username }`,
			text: TAPi18n.__('This_is_a_push_test_messsage'),
			apn: {
				text: `@${ user.username }:\n${ TAPi18n.__('This_is_a_push_test_messsage') }`,
			},
			sound: 'default',
			userId: user._id,
		});

		return {
			message: 'Your_push_was_sent_to_s_devices',
			params: [tokens],
		};
	},
});

function configurePush() {
	if (!settings.get('Push_enable')) {
		return;
	}

	const gateways = settings.get('Push_enable_gateway') && settings.get('Register_Server') && settings.get('Cloud_Service_Agree_PrivacyTerms')
		? settings.get('Push_gateway').split('\n')
		: undefined;

	let apn;
	let gcm;

	if (!gateways) {
		gcm = {
			apiKey: settings.get('Push_gcm_api_key'),
			projectNumber: settings.get('Push_gcm_project_number'),
		};

		apn = {
			passphrase: settings.get('Push_apn_passphrase'),
			key: settings.get('Push_apn_key'),
			cert: settings.get('Push_apn_cert'),
		};

		if (settings.get('Push_production') !== true) {
			apn = {
				passphrase: settings.get('Push_apn_dev_passphrase'),
				key: settings.get('Push_apn_dev_key'),
				cert: settings.get('Push_apn_dev_cert'),
				gateway: 'gateway.sandbox.push.apple.com',
			};
		}

		if (!apn.key || apn.key.trim() === '' || !apn.cert || apn.cert.trim() === '') {
			apn = undefined;
		}

		if (!gcm.apiKey || gcm.apiKey.trim() === '' || !gcm.projectNumber || gcm.projectNumber.trim() === '') {
			gcm = undefined;
		}
	}

	Push.configure({
		apn,
		gcm,
		production: settings.get('Push_production'),
		gateways,
		uniqueId: settings.get('uniqueID'),
		getAuthorization() {
			return `Bearer ${ getWorkspaceAccessToken() }`;
		},
	});
}

Meteor.startup(configurePush);
