import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): void {
	settingsRegistry.addGroup('General', function () {
		this.with(
			{
				enterprise: true,
				modules: ['outlook-calendar'],
			},
			function () {
				this.add('Outlook_Calendar_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					hidden: true,
				});

				this.add('Outlook_Calendar_Exchange_Url', '', {
					type: 'string',
					public: true,
					invalidValue: '',
					hidden: true,
				});
			},
		);
	});
}

