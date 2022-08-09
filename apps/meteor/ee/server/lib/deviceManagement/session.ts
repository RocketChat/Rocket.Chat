import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { UAParser } from 'ua-parser-js';
import type { ISocketConnection, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import * as Mailer from '../../../../app/mailer';
import { settings } from '../../../../app/settings/server';
import { UAParserDesktop, UAParserMobile } from '../../../../app/statistics/server/lib/UAParserCustom';
import { deviceManagementEvents } from '../../../../server/services/device-management/events';
import { hasLicense } from '../../../app/license/server/license';
import { t } from '../../../../app/utils/server';

let mailTemplates: string;

Meteor.startup(() => {
	Mailer.getTemplate('Device_Management_Email_Body', (template) => {
		mailTemplates = template;
	});
});

const uaParser = async (
	uaString: ISocketConnection['httpHeaders']['user-agent'],
): Promise<UAParser.IResult & { app?: { name: string; version: string; bundle: string } }> => {
	let rcAgent = {};
	if (uaString && UAParserMobile.isMobileApp(uaString)) {
		rcAgent = UAParserMobile.uaObject(uaString);
	}

	if (uaString && UAParserDesktop.isDesktopApp(uaString)) {
		rcAgent = UAParserDesktop.uaObject(uaString);
	}

	const ua = new UAParser(uaString);
	return { ...ua.getResult(), ...rcAgent };
};

export const listenSessionLogin = async (): Promise<void> => {
	deviceManagementEvents.on('device-login', async ({ userId, connection }) => {
		if (!hasLicense('device-management')) return;

		const user = await Users.findOneById<IUser>(userId, { projection: { name: 1, username: 1, emails: 1 } });
		if (user?.emails?.length && !connection.loginToken) {
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
				osInfo: `${os.name} ${os.version || ''}`,
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
					mailData.osInfo = `${os.name} ${os.version || ''}`;
					mailData.deviceInfo = `${device.type} ${device.vendor || ''} ${device.model || ''} ${cpu.architecture || ''}`;
					break;
				case 'mobile-app':
					mailData.browserInfo = `Rocket.Chat App ${app?.bundle || app?.version}`;
					mailData.osInfo = `${os.name} ${os.version || ''}`;
					mailData.deviceInfo = 'Mobile App';
					break;
				case 'desktop-app':
					mailData.browserInfo = `Rocket.Chat ${app?.name || browser.name} ${app?.bundle || app?.version || browser.version}`;
					mailData.osInfo = `${os.name} ${os.version || ''}`;
					mailData.deviceInfo = `Desktop App ${cpu.architecture || ''}`;
					break;
				default:
					mailData.userAgent = connection.httpHeaders['user-agent'] || '';
					break;
			}

			try {
				Mailer.send({
					to: `${name} <${email}>`,
					from: Accounts.emailTemplates.from,
					subject: settings.get('Device_Management_Email_Subject'),
					html: mailTemplates,
					data: mailData,
				});
			} catch ({ message }) {
				throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${message}`, {
					method: 'listenSessionLogin',
					message,
				});
			}
		}
	});
};
