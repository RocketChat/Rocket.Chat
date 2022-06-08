import { Meteor } from 'meteor/meteor';
import { UAParser } from 'ua-parser-js';
import { ISocketConnection, IUser } from '@rocket.chat/core-typings';

import * as Mailer from '../../../../app/mailer';
import { Users } from '../../../../app/models/server/raw/index';
import { settings } from '../../../../app/settings/server';
import { UAParserDesktop, UAParserMobile } from '../../../../app/statistics/server/lib/UAParserCustom';
import { sauEvents } from '../../../../server/services/sauMonitor/events';
import { hasLicense } from '../../../app/license/server/license';

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
	sauEvents.on('accounts.login', async ({ userId, connection }) => {
		if (!hasLicense('device-management')) return;

		const user = await Users.findOneById<IUser>(userId, { projection: { name: 1, username: 1, emails: 1 } });
		if (user?.emails?.length && !connection.loginToken) {
			const {
				name,
				username,
				emails: [{ address: email }],
			} = user;
			const { browser, os, device, cpu, app } = await uaParser(connection.httpHeaders['user-agent']);

			let html = `<p><strong>${name} (${username}) logged in via</strong></p>`;

			switch (device.type) {
				case 'mobile':
				case 'tablet':
				case 'smarttv':
					html += `
						<ul>
							<li><strong>Client:</strong> ${browser.name} ${browser.version}</li>
							<li><strong>OS:</strong> ${os.name} ${os.version || ''}</li>
							<li><strong>Device:</strong> ${device.type} ${device.vendor || ''} ${device.model || ''} ${cpu.architecture || ''}</li>
							<li><strong>IP:</strong> <a href='https://ipinfo.io/${connection.clientAddress}'>${connection.clientAddress}</a></li>
						</ul>
					`;
					break;
				case 'mobile-app':
					html += `
							<ul>
								<li><strong>Client:</strong> ${app?.name} ${app?.bundle || app?.version}</li>
								<li><strong>OS:</strong> ${os.name} ${os.version || ''}</li>
								<li><strong>Device:</strong> ${device.type}</li>
								<li><strong>IP:</strong> <a href='https://ipinfo.io/${connection.clientAddress}'>${connection.clientAddress}</a></li>
							</ul>
					`;
					break;
				case 'desktop-app':
					html += `
							<ul>
								<li><strong>Client:</strong> ${app?.name || browser.name} ${app?.bundle || app?.version || browser.version}</li>
								<li><strong>OS:</strong> ${os.name} ${os.version || ''}</li>
								<li><strong>Device:</strong> ${device.type} ${cpu.architecture || ''}</li>
								<li><strong>IP:</strong> <a href='https://ipinfo.io/${connection.clientAddress}'>${connection.clientAddress}</a></li>
							</ul>
					`;
					break;
				default:
					html += `
						<ul>
							<li><strong>Client:</strong> ${browser.name} ${browser.version}</li>
							<li><strong>OS:</strong> ${os.name} ${os.version || ''}</li>
							<li><strong>Device:</strong> ${device.type || 'UNKNOWN'} ${device.vendor || ''} ${device.model || ''} ${cpu.architecture || ''}</li>
							<li>
								<strong>IP:</strong> 
								<a href='https://ipinfo.io/${connection.clientAddress}'>${connection.clientAddress}</a>
							</li>
						</ul>
						<small>${connection.httpHeaders['user-agent']}</small>
					`;
					break;
			}

			html += `
				<br>
				<p style="text-align: center;">
					<a href='${settings.get('Site_Url')}'>Click here to access your account.</a>
				</p>
			`;

			Meteor.defer(() => {
				try {
					Mailer.send({
						to: `${name} <${email}>`,
						from: `Rocket.Chat <${settings.get('From_Email')}>`,
						subject: 'Login started',
						html,
					});
				} catch ({ message }) {
					throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${message}`, {
						method: 'listenSessionLogin',
						message,
					});
				}
			});
		}
	});
};
