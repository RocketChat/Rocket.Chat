import { getWorkspaceAccessToken } from '../../app/cloud/server';
import { Push } from '../../app/push/server';
import type { ICachedSettings } from '../../app/settings/server/CachedSettings';

export async function configurePushNotifications(settings: ICachedSettings): Promise<void> {
	settings.watch<boolean>('Push_enable', async (enabled) => {
		if (!enabled) {
			return;
		}
		const gateways =
			settings.get('Push_enable_gateway') && settings.get('Register_Server') && settings.get('Cloud_Service_Agree_PrivacyTerms')
				? settings.get<string>('Push_gateway').split('\n')
				: undefined;

		let apn:
			| {
					passphrase: string;
					key: string;
					cert: string;
					gateway?: string;
			  }
			| undefined;
		let gcm:
			| {
					apiKey: string;
					projectNumber: string;
			  }
			| undefined;

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
			async getAuthorization() {
				return `Bearer ${await getWorkspaceAccessToken()}`;
			},
		});
	});
}
