import { API } from '/app/api/server';
import {
	AuthenticationResponseJSON,
	generateRegistrationOptions,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
	VerifiedRegistrationResponse,
	verifyRegistrationResponse,
	WebAuthnCredential,
} from '@simplewebauthn/server';
import { generateAuthenticationOptions, VerifiedAuthenticationResponse, verifyAuthenticationResponse } from '@simplewebauthn/server/esm';
import { Random } from 'meteor/random';
import { Meteor } from 'meteor/meteor';
import { ISocketConnection, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { settings } from '/app/settings/server';

import * as Mailer from '../../mailer/server/api';
import { i18n } from '/server/lib/i18n';
import { getUserPreference } from '/app/utils/server/lib/getUserPreference';
import { UAParser } from 'ua-parser-js';
import { UAParserDesktop, UAParserMobile } from '/app/statistics/server/lib/UAParserCustom';
import { t } from '/app/utils/lib/i18n';
import moment from 'moment/moment';
import { Accounts } from 'meteor/accounts-base';
// console.log(111111111111111111111111111)
// console.log(process.env.TEST_MODE);
// console.log(process.env.NODE_ENV);

const siteName: string = settings.get('Site_Name');
const siteUrl: URL = new URL(settings.get('Site_Url')); // TODO fzh075 Whether there is a problem that cannot be updated in time？
class Passkey {
	// TODO fzh075 Optimize by document
	private idAndChallenge = {};

	private rpName = siteName;

	// TODO fzh075 can't use "process.env"?
	private rpID = process.env.TEST_MODE === 'true' ? 'localhost' : siteUrl.hostname; // TODO fzh075 Delete the comments siteUrl.replace(/^https?:\/\//, "")

	private expectedRPID = this.rpID;

	private expectedOrigin = process.env.TEST_MODE === 'true' ? 'http://localhost:3000' : siteUrl.href.slice(0, -1); // TODO fzh075 Domain name adaptation may need to be adjusted

	public async generateRegistrationOptions(userId: IUser['_id']): Promise<{
		id: string;
		options: PublicKeyCredentialCreationOptionsJSON;
	}> {
		const user = await Users.findOneById(userId, {
			projection: {
				_id: 1,
				username: 1,
				idForPasskey: 1,
				passkeys: 1,
			},
		});
		const options = await generateRegistrationOptions({
			rpName: this.rpName,
			rpID: this.rpID,
			userName: user.username,
			attestationType: 'none',
			excludeCredentials: user.passkeys?.map((cred) => ({
				id: cred.id,
				// type: 'public-key',
				transports: cred.transports,
			})),
			authenticatorSelection: {
				residentKey: 'preferred',
				userVerification: 'preferred',
			},
			// supportedAlgorithmIDs: [-7, -257],
		});
		if (!user.idForPasskey) {
			await Users.createIdForPasskey(user._id, options.user.id);
		} else {
			options.user.id = user.idForPasskey;
		}

		let id;
		do {
			id = Random.id();
		} while (this.idAndChallenge[id]);
		this.idAndChallenge[id] = options.challenge;

		return { id, options };
	}

	public async verifyRegistrationResponse(
		userId: IUser['_id'],
		id: string,
		registrationResponse: RegistrationResponseJSON,
		name: string,
		connection,
	) {
		const expectedChallenge = this.idAndChallenge[id];
		delete this.idAndChallenge[id];

		let verification: VerifiedRegistrationResponse;
		try {
			verification = await verifyRegistrationResponse({
				response: registrationResponse,
				expectedChallenge,
				expectedOrigin: this.expectedOrigin,
				expectedRPID: this.expectedRPID,
				// requireUserVerification: false,
			});
		} catch (error) {
			throw new Meteor.Error('verification error', error.message);
		}

		if (!verification.verified) {
			throw new Meteor.Error('verification failed');
		}

		let passkey = verification.registrationInfo!.credential;
		passkey.name = name;
		passkey.sync = !!registrationResponse.clientExtensionResults.credProps?.be;
		passkey.platform = connection.httpHeaders['sec-ch-ua-platform'];

		const passkeys = await Users.findPasskeysByUserId(userId);
		const existingCredential = passkeys?.find((key) => key.id === passkey.id);
		if (existingCredential) {
			return;
		}

		await Users.createPasskey(userId, passkey);
		await this.sendPasskeyChangeEmail(userId, 'create', connection);
	}

	public async generateAuthenticationOptions(): Promise<{
		id: string;
		options: PublicKeyCredentialRequestOptionsJSON;
	}> {
		const options = await generateAuthenticationOptions({
			rpID: this.rpID,
			timeout: 60000,
			// allowCredentials: user.credentials.map((cred) => ({
			// 	id: cred.credentialId,
			// 	// type: 'public-key',
			// 	transports: cred.transports,
			// })),
			// userVerification: 'preferred',
		});

		let id;
		do {
			id = Random.id();
		} while (this.idAndChallenge[id]);
		this.idAndChallenge[id] = options.challenge;

		return { id, options };
	}

	public async verifyAuthenticationResponse(id: string, authenticationResponse: AuthenticationResponseJSON): Promise<string> {
		const expectedChallenge = this.idAndChallenge[id];
		delete this.idAndChallenge[id];
		// TODO fzh075
		// const user = await Users.findOne({ idForPasskey:  });

		// TODO fzh075 Should this be included in Users.ts?
		const user = await Users.findOne({ passkeys: { $elemMatch: { id: authenticationResponse.id } } }); // TODO fzh075 Should this be included in Users.ts?
		if (!user) throw new Meteor.Error('Authenticator is not registered with this site');
		const passkeys = await Users.findPasskeysByUserId(user._id);
		const passkey = passkeys.find((key) => key.id === authenticationResponse.id);
		passkey.publicKey = passkey.publicKey.buffer;

		let verification: VerifiedAuthenticationResponse;
		try {
			verification = await verifyAuthenticationResponse({
				response: authenticationResponse,
				expectedChallenge,
				expectedOrigin: this.expectedOrigin,
				expectedRPID: this.expectedRPID,
				credential: passkey,
				requireUserVerification: false,
			});
		} catch (error) {
			throw new Meteor.Error('verification error', error.message);
		}

		if (!verification.verified) {
			throw new Meteor.Error('verification failed');
		}

		await Users.updatePasskeyCounter(user._id, authenticationResponse.id, verification.authenticationInfo.newCounter);
		return user._id;
	}

	public async findPasskeys(userId: string): Promise<WebAuthnCredential[]> {
		const user = await Users.findOneById(userId, {
			projection: {
				'passkeys.id': 1,
				'passkeys.name': 1,
				'passkeys.createdAt': 1,
				'passkeys.lastUsedAt': 1,
				'passkeys.sync': 1,
				'passkeys.platform': 1,
			},
		});
		return user?.passkeys;
	}

	public async editPasskey(userId: string, passkeyId: string, name: string) {
		await Users.updatePasskey(userId, passkeyId, name);
	}

	public async deletePasskey(userId: string, passkeyId: string, connection) {
		await Users.deletePasskey(userId, passkeyId);
		await this.sendPasskeyChangeEmail(userId, 'delete', connection);
	}

	// TODO fzh075 copied from 'apps/meteor/ee/server/lib/deviceManagement/session.ts'
	public async uaParser(
		uaString: ISocketConnection['httpHeaders']['user-agent'],
	): Promise<UAParser.IResult & { app?: { name: string; version: string; bundle: string } }> {
		const ua = new UAParser(uaString);
		return {
			...ua.getResult(),
			...(uaString && UAParserMobile.isMobileApp(uaString) && UAParserMobile.uaObject(uaString)),
			...(uaString && UAParserDesktop.isDesktopApp(uaString) && UAParserDesktop.uaObject(uaString)),
		};
	}

	// TODO fzh075 private
	public async sendPasskeyChangeEmail(userId: string, action: 'create' | 'delete', connection) {
		// TODO fzh075 setting
		// const deviceEnabled = settings.get('Device_Management_Enable_Login_Emails');
		// if (!deviceEnabled) {
		// 	return;
		// }

		const user = await Users.findOneById(userId, {
			projection: { name: 1, username: 1, emails: 1, language: 1 },
		});

		if (!user?.emails?.length) {
			return;
		}

		// const userReceiveLoginEmailPreference =
		// 	!settings.get('Device_Management_Allow_Login_Email_preference') ||
		// 	(await getUserPreference(userId, 'receiveLoginDetectionEmail', true));
		// if (!userReceiveLoginEmailPreference) {
		// 	return;
		// }

		const language = user.language || settings.get('Language') || 'en';
		const t = i18n.getFixedT(language);

		const dateFormat = settings.get('Message_TimeAndDateFormat');
		const {
			name,
			username,
			emails: [{ address: email }],
		} = user;
		const { browser, os, device, cpu, app } = await this.uaParser(connection.httpHeaders['user-agent']);

		// TODO fzh075 connection.clientAddress reliability
		const mailData = {
			actionText: {
				create: t('Passkey_Added'),
				delete: t('Passkey_Removed'),
				edit: t('Passkey_Edited'),
			}[action],
			name,
			username,
			browserInfo: `${browser.name} ${browser.version}`,
			osInfo: `${os.name}`,
			deviceInfo: `${device.type || t('Device_Management_Device_Unknown')} ${device.vendor || ''} ${device.model || ''} ${
				cpu.architecture || ''
			}`,
			ipInfo: connection.clientAddress,
			userAgent: '',
			date: moment().format(String(dateFormat)),
		};

		switch (device.type) {
			case 'mobile':
			case 'tablet':
			case 'smarttv':
				mailData.browserInfo = `${browser.name} ${browser.version}`;
				mailData.osInfo = `${os.name}`;
				mailData.deviceInfo = `${device.type} ${device.vendor || ''} ${device.model || ''} ${cpu.architecture || ''}`;
				break;
			case 'mobile-app':
				mailData.browserInfo = `Rocket.Chat App ${app?.bundle || app?.version}`;
				mailData.osInfo = `${os.name}`;
				mailData.deviceInfo = 'Mobile App';
				break;
			case 'desktop-app':
				mailData.browserInfo = `Rocket.Chat ${app?.name || browser.name} ${app?.bundle || app?.version || browser.version}`;
				mailData.osInfo = `${os.name}`;
				mailData.deviceInfo = `Desktop App ${cpu.architecture || ''}`;
				break;
			default:
				mailData.userAgent = connection.httpHeaders['user-agent'] || '';
				break;
		}

		const html = `
			<h2 class="rc-color">{Security_Alert}</h2>
			<p>
				{Hello} <strong>[name] ([username])</strong>
				<p>{A_change_was_made_to_your_passkeys}: [actionText]</p>
				<p>{If_you_did_not_make_this_change_please_contact_your_administrator}</p>
			</p>
			<p>
				<strong>{Device_Management_Client}:</strong> [browserInfo]<br>
				<strong>{Device_Management_OS}:</strong> [osInfo]<br>
				<strong>{Device_Management_Device}:</strong> [deviceInfo]<br>
				<strong>{Device_Management_IP}:</strong> [ipInfo]<br>
				<strong>{Date}:</strong> [date]
			</p>
			<p>
				<small>[userAgent]</small>
			</p>
			<p>
				<a class="btn" href="[Site_URL]">{Access_Your_Account}</a><br>
				{Or_Copy_And_Paste_This_URL_Into_A_Tab_Of_Your_Browser}<br>
				<a href="[Site_URL]">[SITE_URL]</a>
			</p>

			<p>{Thank_You_For_Choosing_RocketChat}</p>
			`;

		try {
			await Mailer.send({
				to: `${name} <${email}>`,
				from: Accounts.emailTemplates.from,
				subject: t('Security_Alert_Passkey_Changed'),
				html,
				data: mailData,
			});
		} catch (error) {
			console.error('Error sending passkey security alert email:', error);
		}

		// Mailer.send({
		// 	to: user.emails[0].address,
		// 	from: settings.get('From_Email'),
		// 	subject: settings.get('Passkey_Added_Email_Subject'),
		// 	html: settings.get('Passkey_Added_Email_Body'),
		// 	data: {
		// 		name: user.name,
		// 		username: user.username,
		// 		// ipInfo: clientIp,
		// 		date: moment().format(settings.get('Message_TimeAndDateFormat')),
		// 		// osInfo: ...
		// 	},
		// });
	}
}

export const passkey = new Passkey();

// TODO fzh075
// Meteor.startup(() => {
// 	Meteor.setInterval(async () => {
// 		try {
// 			await Users.removeUnusedPasskeys(120);
// 		} catch (error) {
// 			console.error('Error removing unused passkeys:', error);
// 		}
// 	}, 24 * 60 * 60 * 1000);
// });
