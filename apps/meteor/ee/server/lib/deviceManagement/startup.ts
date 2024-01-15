import { Permissions } from '@rocket.chat/models';

import { settingsRegistry } from '../../../../app/settings/server/index';

export const createPermissions = async (): Promise<void> => {
	await Promise.all([
		Permissions.create('logout-device-management', ['admin']),
		Permissions.create('block-ip-device-management', ['admin']),
	]);
};

export const createEmailTemplates = async (): Promise<void> => {
	await settingsRegistry.addGroup('Email', async function () {
		await this.section('Device Management - Login Detected', async function () {
			await this.add('Device_Management_Email_Subject', '{Device_Management_Email_Subject}', {
				type: 'string',
				i18nLabel: 'Subject',
			});
			await this.add(
				'Device_Management_Email_Body',
				'<h2 class="rc-color">{Login_Detected}</h2><p><strong>[name] ([username]) {Logged_In_Via}</strong></p><p><strong>{Device_Management_Client}:</strong> [browserInfo]<br><strong>{Device_Management_OS}:</strong> [osInfo]<br><strong>{Device_Management_Device}:</strong> [deviceInfo]<br><strong>{Device_Management_IP}:</strong>[ipInfo]<br><strong>{Date}:</strong> [date]</p><p><small>[userAgent]</small></p><a class="btn" href="[Site_URL]">{Access_Your_Account}</a><p>{Or_Copy_And_Paste_This_URL_Into_A_Tab_Of_Your_Browser}<br><a href="[Site_URL]">[SITE_URL]</a></p><p>{Thank_You_For_Choosing_RocketChat}</p>',
				{
					type: 'code',
					code: 'text/html',
					multiline: true,
					i18nLabel: 'Body',
					i18nDescription: 'Device_Management_Email_Body',
				},
			);
		});
	});
};
