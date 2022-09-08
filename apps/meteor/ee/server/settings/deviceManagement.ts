import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): void {
	settingsRegistry.addGroup('Device_Management', function () {
		this.with(
			{
				enterprise: true,
				modules: ['device-management'],
			},
			function () {
				this.add('Device_Management_Enable_Login_Emails', true, {
					type: 'boolean',
					public: true,
					invalidValue: true,
				});
			},
		);
	});
}
