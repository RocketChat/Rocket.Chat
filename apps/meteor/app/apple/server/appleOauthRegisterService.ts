import { createPrivateKey, sign } from 'node:crypto';

import { ServiceConfiguration } from 'meteor/service-configuration';

import { AppleCustomOAuth } from './AppleCustomOAuth';
import { settings } from '../../settings/server';
import { config } from '../lib/config';

new AppleCustomOAuth('apple', config);

const toBase64Url = (obj: Record<string, any>) => Buffer.from(JSON.stringify(obj)).toString('base64url');

function generateAppleClientSecret(header: Record<string, any>, payload: Record<string, any>, privateKeyString: string): string {
	const headerB64 = toBase64Url(header);
	const payloadB64 = toBase64Url(payload);
	const dataToSign = `${headerB64}.${payloadB64}`;

	const privateKey = createPrivateKey({
		key: privateKeyString,
		format: 'pem',
		type: 'pkcs8',
	});

	const signature = sign('sha256', Buffer.from(dataToSign), {
		key: privateKey,
		dsaEncoding: 'ieee-p1363',
	});

	const signatureB64 = signature.toString('base64url');

	return `${dataToSign}.${signatureB64}`;
}

settings.watchMultiple(
	[
		'Accounts_OAuth_Apple',
		'Accounts_OAuth_Apple_id',
		'Accounts_OAuth_Apple_secretKey',
		'Accounts_OAuth_Apple_iss',
		'Accounts_OAuth_Apple_kid',
	],
	async ([enabled, clientId, serverSecret, iss, kid]) => {
		if (!enabled) {
			return ServiceConfiguration.configurations.removeAsync({
				service: 'apple',
			});
		}

		const [normalizedClientId, normalizedServerSecret, normalizedIss, normalizedKid] = [clientId, serverSecret, iss, kid].map((value) =>
			typeof value === 'string' ? value.trim() : '',
		);

		const hasAllFields = [normalizedClientId, normalizedServerSecret, normalizedIss, normalizedKid].every(Boolean);

		// Hide web button if settings are incomplete, but preserve mobile-only setup if enabled.
		if (!hasAllFields) {
			await ServiceConfiguration.configurations.upsertAsync(
				{
					service: 'apple',
				},
				{
					$set: {
						showButton: false,
						enabled: settings.get('Accounts_OAuth_Apple'),
					},
				},
			);
			return;
		}

		const HEADER = {
			kid: normalizedKid,
			alg: 'ES256',
		};

		const now = new Date();
		const exp = new Date();
		exp.setMonth(exp.getMonth() + 5);

		try {
			const secret = generateAppleClientSecret(
				HEADER,
				{
					iss: normalizedIss,
					iat: Math.floor(now.getTime() / 1000),
					exp: Math.floor(exp.getTime() / 1000),
					aud: 'https://appleid.apple.com',
					sub: normalizedClientId,
				},
				normalizedServerSecret,
			);

			await ServiceConfiguration.configurations.upsertAsync(
				{
					service: 'apple',
				},
				{
					$set: {
						showButton: true,
						secret,
						enabled: settings.get('Accounts_OAuth_Apple'),
						loginStyle: 'popup',
						clientId: normalizedClientId,
						buttonColor: '#000',
						buttonLabelColor: '#FFF',
					},
				},
			);
		} catch (error) {
			console.error('Failed to configure Apple OAuth service', error);

			await ServiceConfiguration.configurations.upsertAsync(
				{
					service: 'apple',
				},
				{
					$set: {
						showButton: false,
						enabled: settings.get('Accounts_OAuth_Apple'),
					},
				},
			);
		}
	},
);
