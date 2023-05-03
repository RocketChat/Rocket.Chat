import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): void {
	void settingsRegistry.addGroup('Outlook_Calendar', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['outlook-calendar'],
			},
			async function () {
				await this.add('Outlook_Calendar_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
				});

				await this.add('Outlook_Calendar_Exchange_Url', '', {
					type: 'string',
					public: true,
					invalidValue: '',
				});

				await this.add('Outlook_Calendar_Outlook_Url', '', {
					type: 'string',
					public: true,
					invalidValue: '',
				});
			},
		);
	});
}
