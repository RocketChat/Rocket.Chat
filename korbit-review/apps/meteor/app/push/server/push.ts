import type { IAppsTokens, RequiredField, Optional, IPushNotificationConfig } from '@rocket.chat/core-typings';
import { AppsTokens } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { pick } from '@rocket.chat/tools';
import Ajv from 'ajv';
import { JWT } from 'google-auth-library';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { initAPN, sendAPN } from './apn';
import type { PushOptions, PendingPushNotification } from './definition';
import { sendFCM } from './fcm';
import { logger } from './logger';
import { settings } from '../../settings/server';

export const _matchToken = Match.OneOf({ apn: String }, { gcm: String });

const ajv = new Ajv({
	coerceTypes: true,
});

type FCMCredentials = {
	type: string;
	project_id: string;
	private_key_id: string;
	private_key: string;
	client_email: string;
	client_id: string;
	auth_uri: string;
	token_uri: string;
	auth_provider_x509_cert_url: string;
	client_x509_cert_url: string;
	universe_domain: string;
};

export const FCMCredentialsValidationSchema = {
	type: 'object',
	properties: {
		type: {
			type: 'string',
		},
		project_id: {
			type: 'string',
		},
		private_key_id: {
			type: 'string',
		},
		private_key: {
			type: 'string',
		},
		client_email: {
			type: 'string',
		},
		client_id: {
			type: 'string',
		},
		auth_uri: {
			type: 'string',
		},
		token_uri: {
			type: 'string',
		},
		auth_provider_x509_cert_url: {
			type: 'string',
		},
		client_x509_cert_url: {
			type: 'string',
		},
		universe_domain: {
			type: 'string',
		},
	},
	required: ['client_email', 'project_id', 'private_key_id', 'private_key'],
};

export const isFCMCredentials = ajv.compile<FCMCredentials>(FCMCredentialsValidationSchema);

// This type must match the type defined in the push gateway
type GatewayNotification = {
	uniqueId: string;
	from: string;
	title: string;
	text: string;
	badge?: number;
	sound?: string;
	notId?: number;
	contentAvailable?: 1 | 0;
	forceStart?: number;
	topic?: string;
	apn?: {
		from?: string;
		title?: string;
		text?: string;
		badge?: number;
		sound?: string;
		notId?: number;
		category?: string;
	};
	gcm?: {
		from?: string;
		title?: string;
		text?: string;
		image?: string;
		style?: string;
		summaryText?: string;
		picture?: string;
		badge?: number;
		sound?: string;
		notId?: number;
		actions?: any[];
	};
	query?: {
		userId: any;
	};
	token?: IAppsTokens['token'];
	tokens?: IAppsTokens['token'][];
	payload?: Record<string, any>;
	delayUntil?: Date;
	createdAt: Date;
	createdBy?: string;
};

export type NativeNotificationParameters = {
	userTokens: string | string[];
	notification: PendingPushNotification;
	_replaceToken: (currentToken: IAppsTokens['token'], newToken: IAppsTokens['token']) => void;
	_removeToken: (token: IAppsTokens['token']) => void;
	options: RequiredField<PushOptions, 'gcm'>;
};

class PushClass {
	options: PushOptions = {
		uniqueId: '',
	};

	isConfigured = false;

	public configure(options: PushOptions): void {
		this.options = {
			sendTimeout: 60000, // Timeout period for notification send
			...options,
		};
		// https://npmjs.org/package/apn

		// After requesting the certificate from Apple, export your private key as
		// a .p12 file anddownload the .cer file from the iOS Provisioning Portal.

		// gateway.push.apple.com, port 2195
		// gateway.sandbox.push.apple.com, port 2195

		// Now, in the directory containing cert.cer and key.p12 execute the
		// following commands to generate your .pem files:
		// $ openssl x509 -in cert.cer -inform DER -outform PEM -out cert.pem
		// $ openssl pkcs12 -in key.p12 -out key.pem -nodes

		// Block multiple calls
		if (this.isConfigured) {
			throw new Error('Configure should not be called more than once!');
		}

		this.isConfigured = true;

		logger.debug('Configure', this.options);

		if (this.options.apn) {
			initAPN({ options: this.options as RequiredField<PushOptions, 'apn'>, absoluteUrl: Meteor.absoluteUrl() });
		}
	}

	private replaceToken(currentToken: IAppsTokens['token'], newToken: IAppsTokens['token']): void {
		void AppsTokens.updateMany({ token: currentToken }, { $set: { token: newToken } });
	}

	private removeToken(token: IAppsTokens['token']): void {
		void AppsTokens.deleteOne({ token });
	}

	private shouldUseGateway(): boolean {
		return Boolean(!!this.options.gateways && settings.get('Register_Server') && settings.get('Cloud_Service_Agree_PrivacyTerms'));
	}

	private async sendNotificationNative(
		app: IAppsTokens,
		notification: PendingPushNotification,
		countApn: string[],
		countGcm: string[],
	): Promise<void> {
		logger.debug('send to token', app.token);

		if ('apn' in app.token && app.token.apn) {
			countApn.push(app._id);
			// Send to APN
			if (this.options.apn) {
				sendAPN({ userToken: app.token.apn, notification: { topic: app.appName, ...notification }, _removeToken: this.removeToken });
			}
		} else if ('gcm' in app.token && app.token.gcm) {
			countGcm.push(app._id);

			// override this.options.gcm.apiKey with the oauth2 token
			const { projectId, token } = await this.getNativeNotificationAuthorizationCredentials();
			const sendGCMOptions = {
				...this.options,
				gcm: {
					...this.options.gcm,
					apiKey: token,
					projectNumber: projectId,
				},
			};

			sendFCM({
				userTokens: app.token.gcm,
				notification,
				_replaceToken: this.replaceToken,
				_removeToken: this.removeToken,
				options: sendGCMOptions as RequiredField<PushOptions, 'gcm'>,
			});
		} else {
			throw new Error('send got a faulty query');
		}
	}

	private async getNativeNotificationAuthorizationCredentials(): Promise<{ token: string; projectId: string }> {
		const credentialsString = settings.get<string>('Push_google_api_credentials');
		if (!credentialsString.trim()) {
			throw new Error('Push_google_api_credentials is not set');
		}

		try {
			const credentials = JSON.parse(credentialsString);
			if (!isFCMCredentials(credentials)) {
				throw new Error('Push_google_api_credentials is not in the correct format');
			}

			const client = new JWT({
				email: credentials.client_email,
				key: credentials.private_key,
				keyId: credentials.private_key_id,
				scopes: 'https://www.googleapis.com/auth/firebase.messaging',
			});

			await client.authorize();

			return {
				token: client.credentials.access_token as string,
				projectId: credentials.project_id,
			};
		} catch (error) {
			logger.error('Error getting FCM token', error);
			throw new Error('Error getting FCM token');
		}
	}

	private async sendGatewayPush(
		gateway: string,
		service: 'apn' | 'gcm',
		token: string,
		notification: Optional<GatewayNotification, 'uniqueId'>,
		tries = 0,
	): Promise<void> {
		notification.uniqueId = this.options.uniqueId;

		const options = {
			method: 'POST',
			body: {
				token,
				options: notification,
			},
			...(token && this.options.getAuthorization && { headers: { Authorization: await this.options.getAuthorization() } }),
		};

		const result = await fetch(`${gateway}/push/${service}/send`, options);
		const response = await result.text();

		if (result.status === 406) {
			logger.info('removing push token', token);
			await AppsTokens.deleteMany({
				$or: [
					{
						'token.apn': token,
					},
					{
						'token.gcm': token,
					},
				],
			});
			return;
		}

		if (result.status === 422) {
			logger.info('gateway rejected push notification. not retrying.', response);
			return;
		}

		if (result.status === 401) {
			logger.warn('Error sending push to gateway (not authorized)', response);
			return;
		}

		if (result.ok) {
			return;
		}

		logger.error({ msg: `Error sending push to gateway (${tries} try) ->`, err: response });

		if (tries <= 4) {
			// [1, 2, 4, 8, 16] minutes (total 31)
			const ms = 60000 * Math.pow(2, tries);

			logger.log('Trying sending push to gateway again in', ms, 'milliseconds');

			setTimeout(() => this.sendGatewayPush(gateway, service, token, notification, tries + 1), ms);
		}
	}

	private getGatewayNotificationData(notification: PendingPushNotification): Omit<GatewayNotification, 'uniqueId'> {
		// Gateway currently accepts every attribute from the PendingPushNotification type, except for the priority
		// If new attributes are added to the PendingPushNotification type, they'll need to be removed here as well.
		const { priority: _priority, ...notifData } = notification;

		return {
			...notifData,
		};
	}

	private async sendNotificationGateway(
		app: IAppsTokens,
		notification: PendingPushNotification,
		countApn: string[],
		countGcm: string[],
	): Promise<void> {
		if (!this.options.gateways) {
			return;
		}

		const gatewayNotification = this.getGatewayNotificationData(notification);

		for (const gateway of this.options.gateways) {
			logger.debug('send to token', app.token);

			if ('apn' in app.token && app.token.apn) {
				countApn.push(app._id);
				return this.sendGatewayPush(gateway, 'apn', app.token.apn, { topic: app.appName, ...gatewayNotification });
			}

			if ('gcm' in app.token && app.token.gcm) {
				countGcm.push(app._id);
				return this.sendGatewayPush(gateway, 'gcm', app.token.gcm, gatewayNotification);
			}
		}
	}

	private async sendNotification(notification: PendingPushNotification): Promise<{ apn: string[]; gcm: string[] }> {
		logger.debug('Sending notification', notification);

		const countApn: string[] = [];
		const countGcm: string[] = [];

		if (notification.from !== String(notification.from)) {
			throw new Error('Push.send: option "from" not a string');
		}
		if (notification.title !== String(notification.title)) {
			throw new Error('Push.send: option "title" not a string');
		}
		if (notification.text !== String(notification.text)) {
			throw new Error('Push.send: option "text" not a string');
		}

		logger.debug(`send message "${notification.title}" to userId`, notification.userId);

		const query = {
			userId: notification.userId,
			$or: [{ 'token.apn': { $exists: true } }, { 'token.gcm': { $exists: true } }],
		};

		const appTokens = AppsTokens.find(query);

		for await (const app of appTokens) {
			logger.debug('send to token', app.token);

			if (this.shouldUseGateway()) {
				await this.sendNotificationGateway(app, notification, countApn, countGcm);
				continue;
			}

			await this.sendNotificationNative(app, notification, countApn, countGcm);
		}

		if (settings.get('Log_Level') === '2') {
			logger.debug(`Sent message "${notification.title}" to ${countApn.length} ios apps ${countGcm.length} android apps`);

			// Add some verbosity about the send result, making sure the developer
			// understands what just happened.
			if (!countApn.length && !countGcm.length) {
				if ((await AppsTokens.estimatedDocumentCount()) === 0) {
					logger.debug('GUIDE: The "AppsTokens" is empty - No clients have registered on the server yet...');
				}
			} else if (!countApn.length) {
				if ((await AppsTokens.countApnTokens()) === 0) {
					logger.debug('GUIDE: The "AppsTokens" - No APN clients have registered on the server yet...');
				}
			} else if (!countGcm.length) {
				if ((await AppsTokens.countGcmTokens()) === 0) {
					logger.debug('GUIDE: The "AppsTokens" - No GCM clients have registered on the server yet...');
				}
			}
		}

		return {
			apn: countApn,
			gcm: countGcm,
		};
	}

	// This is a general function to validate that the data added to notifications
	// is in the correct format. If not this function will throw errors
	private _validateDocument(notification: PendingPushNotification): void {
		// Check the general notification
		check(notification, {
			from: String,
			title: String,
			text: String,
			sent: Match.Optional(Boolean),
			sending: Match.Optional(Match.Integer),
			badge: Match.Optional(Match.Integer),
			sound: Match.Optional(String),
			notId: Match.Optional(Match.Integer),
			contentAvailable: Match.Optional(Match.Integer),
			apn: Match.Optional({
				category: Match.Optional(String),
			}),
			gcm: Match.Optional({
				image: Match.Optional(String),
				style: Match.Optional(String),
			}),
			userId: String,
			payload: Match.Optional(Object),
			createdAt: Date,
			createdBy: Match.OneOf(String, null),
			priority: Match.Optional(Match.Integer),
		});

		if (!notification.userId) {
			throw new Error('No userId found');
		}
	}

	private hasApnOptions(options: IPushNotificationConfig): options is RequiredField<IPushNotificationConfig, 'apn'> {
		return Match.test(options.apn, Object);
	}

	private hasGcmOptions(options: IPushNotificationConfig): options is RequiredField<IPushNotificationConfig, 'gcm'> {
		return Match.test(options.gcm, Object);
	}

	public async send(options: IPushNotificationConfig) {
		const notification: PendingPushNotification = {
			createdAt: new Date(),
			// createdBy is no longer used, but the gateway still expects it
			createdBy: '<SERVER>',
			sent: false,
			sending: 0,

			...pick(options, 'from', 'title', 'text', 'userId', 'payload', 'badge', 'sound', 'notId', 'priority'),

			...(this.hasApnOptions(options)
				? {
						apn: {
							...pick(options.apn, 'category'),
						},
					}
				: {}),
			...(this.hasGcmOptions(options)
				? {
						gcm: {
							...pick(options.gcm, 'image', 'style'),
						},
					}
				: {}),
		};

		// Validate the notification
		this._validateDocument(notification);

		try {
			await this.sendNotification(notification);
		} catch (error: any) {
			logger.debug(`Could not send notification to user "${notification.userId}", Error: ${error.message}`);
			logger.debug(error.stack);
		}
	}
}

export const Push = new PushClass();
