import { settingsRegistry } from '../../../app/settings/server';

export async function addSettings(): Promise<void> {
	await settingsRegistry.addGroup('Device_Management', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['device-management'],
			},
			async function () {
				await this.add('Device_Management_Enable_Login_Emails', true, {
					type: 'boolean',
					public: true,
					invalidValue: true,
				});

				await this.add('Device_Management_Allow_Login_Email_preference', true, {
					type: 'boolean',
					public: true,
					invalidValue: true,
					enableQuery: { _id: 'Device_Management_Enable_Login_Emails', value: true },
				});
			},
		);
	});
}
