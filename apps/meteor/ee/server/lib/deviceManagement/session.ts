import type { ISocketConnection } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { UAParser } from 'ua-parser-js';

import * as Mailer from '../../../../app/mailer/server/api';
import { settings } from '../../../../app/settings/server';
import { UAParserDesktop, UAParserMobile } from '../../../../app/statistics/server/lib/UAParserCustom';
import { t } from '../../../../app/utils/lib/i18n';
import { getUserPreference } from '../../../../app/utils/server/lib/getUserPreference';
import { deviceManagementEvents } from '../../../../server/services/device-management/events';

let mailTemplates: string;

Meteor.startup(() => {
	Mailer.getTemplate('Device_Management_Email_Body', (template) => {
		mailTemplates = template;
	});
});

const uaParser = async (
	uaString: ISocketConnection['httpHeaders']['user-agent'],
): Promise<UAParser.IResult & { app?: { name: string; version: string; bundle: string } }> => {
	const ua = new UAParser(uaString);
	return {
		...ua.getResult(),
		...(uaString && UAParserMobile.isMobileApp(uaString) && UAParserMobile.uaObject(uaString)),
		...(uaString && UAParserDesktop.isDesktopApp(uaString) && UAParserDesktop.uaObject(uaString)),
	};
};

export const listenSessionLogin = () => {
	return deviceManagementEvents.on('device-login', async ({ userId, connection }) => {
		const deviceEnabled = settings.get('Device_Management_Enable_Login_Emails');

		if (!deviceEnabled) {
			return;
		}

		if (connection.loginToken) {
			return;
		}

		const user = await Users.findOneByIdWithEmailAddress(userId, {
			projection: { 'name': 1, 'username': 1, 'emails': 1, 'settings.preferences.receiveLoginDetectionEmail': 1 },
		});

		if (!user?.emails?.length) {
			return;
		}

		const userReceiveLoginEmailPreference =
			!settings.get('Device_Management_Allow_Login_Email_preference') ||
			(await getUserPreference(userId, 'receiveLoginDetectionEmail', true));

		if (!userReceiveLoginEmailPreference) {
			return;
		}

		const {
			name,
			username,
			emails: [{ address: email }],
		} = user;
		const { browser, os, device, cpu, app } = await uaParser(connection.httpHeaders['user-agent']);

		const mailData = {
			name,
			username,
			browserInfo: `${browser.name} ${browser.version}`,
			osInfo: `${os.name}`,
			deviceInfo: `${device.type || t('Device_Management_Device_Unknown')} ${device.vendor || ''} ${device.model || ''} ${
				cpu.architecture || ''
			}`,
			ipInfo: connection.clientAddress,
			userAgent: '',
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

		try {
			await Mailer.send({
				to: `${name} <${email}>`,
				from: Accounts.emailTemplates.from,
				subject: settings.get('Device_Management_Email_Subject'),
				html: mailTemplates,
				data: mailData,
			});
		} catch ({ message }: any) {
			throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${message}`, {
				method: 'listenSessionLogin',
				message,
			});
		}
	});
};
