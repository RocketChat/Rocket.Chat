import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { TAPi18n } from 'meteor/tap:i18n';
import { SystemLogger } from '../../app/logger';
import { getWorkspaceAccessToken } from '../../app/cloud';
import { Push } from 'meteor/rocketchat:push';
import { hasRole } from '../../app/authorization';
import { settings } from '../../app/settings';


Meteor.methods({
	// log() {
	// 	return console.log(...arguments);
	// },

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

		if (Push.enabled !== true) {
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

		const tokens = Push.appCollection.find(query).count();

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
			query: {
				userId: user._id,
			},
		});

		return {
			message: 'Your_push_was_sent_to_s_devices',
			params: [tokens],
		};
	},
});

function sendPush(service, token, options, tries = 0) {
	options.uniqueId = settings.get('uniqueID');

	const data = {
		data: {
			token,
			options,
		},
		headers: {},
	};

	const workspaceAccesstoken = getWorkspaceAccessToken();
	if (token) {
		data.headers.Authorization = `Bearer ${ workspaceAccesstoken }`;
	}

	return HTTP.post(`${ settings.get('Push_gateway') }/push/${ service }/send`, data, function(error, response) {
		if (response && response.statusCode === 406) {
			console.log('removing push token', token);
			Push.appCollection.remove({
				$or: [{
					'token.apn': token,
				}, {
					'token.gcm': token,
				}],
			});
			return;
		}

		if (!error) {
			return;
		}

		SystemLogger.error(`Error sending push to gateway (${ tries } try) ->`, error);

		if (tries <= 6) {
			const milli = Math.pow(10, tries + 2);

			SystemLogger.log('Trying sending push to gateway again in', milli, 'milliseconds');

			return Meteor.setTimeout(function() {
				return sendPush(service, token, options, tries + 1);
			}, milli);
		}
	});
}

function configurePush() {
	if (settings.get('Push_debug')) {
		Push.debug = true;
		console.log('Push: configuring...');
	}

	if (settings.get('Push_enable') === true) {
		Push.allow({
			send(userId/* , notification*/) {
				return hasRole(userId, 'admin');
			},
		});

		let apn;
		let gcm;

		if (settings.get('Push_enable_gateway') === false) {
			gcm = {
				apiKey: settings.get('Push_gcm_api_key'),
				projectNumber: settings.get('Push_gcm_project_number'),
			};

			apn = {
				passphrase: settings.get('Push_apn_passphrase'),
				keyData: settings.get('Push_apn_key'),
				certData: settings.get('Push_apn_cert'),
			};

			if (settings.get('Push_production') !== true) {
				apn = {
					passphrase: settings.get('Push_apn_dev_passphrase'),
					keyData: settings.get('Push_apn_dev_key'),
					certData: settings.get('Push_apn_dev_cert'),
					gateway: 'gateway.sandbox.push.apple.com',
				};
			}

			if (!apn.keyData || apn.keyData.trim() === '' || !apn.certData || apn.certData.trim() === '') {
				apn = undefined;
			}

			if (!gcm.apiKey || gcm.apiKey.trim() === '' || !gcm.projectNumber || gcm.projectNumber.trim() === '') {
				gcm = undefined;
			}
		}

		Push.Configure({
			apn,
			gcm,
			production: settings.get('Push_production'),
			sendInterval: 5000,
			sendBatchSize: 10,
		});

		if (settings.get('Push_enable_gateway') === true) {
			Push.serverSend = function(options = { badge: 0 }) {
				if (options.from !== String(options.from)) {
					throw new Error('Push.send: option "from" not a string');
				}
				if (options.title !== String(options.title)) {
					throw new Error('Push.send: option "title" not a string');
				}
				if (options.text !== String(options.text)) {
					throw new Error('Push.send: option "text" not a string');
				}
				if (settings.get('Push_debug')) {
					console.log(`Push: send message "${ options.title }" via query`, options.query);
				}

				const query = {
					$and: [options.query, {
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

				return Push.appCollection.find(query).forEach((app) => {
					if (settings.get('Push_debug')) {
						console.log('Push: send to token', app.token);
					}

					if (app.token.apn) {
						options.topic = app.appName;
						return sendPush('apn', app.token.apn, options);
					}

					if (app.token.gcm) {
						return sendPush('gcm', app.token.gcm, options);
					}
				});
			};
		}

		Push.enabled = true;
	}
}

Meteor.startup(configurePush);
