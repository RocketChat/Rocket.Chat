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
					placeholder: 'https://exchange.example.com/',
				});

				await this.add('Outlook_Calendar_Outlook_Url', '', {
					type: 'string',
					public: true,
					invalidValue: '',
					placeholder: 'https://exchange.example.com/owa/#path=/calendar/view/Month',
				});

				await this.add(
					'Calendar_MeetingUrl_Regex',
					'(?:[?&]callUrl=([^\n&<]+))|(?:(?:%3F)|(?:%26))callUrl(?:%3D)((?:(?:[^\n&<](?!%26)))+[^\n&<]?)',
					{
						type: 'string',
						public: true,
						invalidValue: '',
					},
				);

				await this.add('Calendar_BusyStatus_Enabled', true, {
					type: 'boolean',
					public: true,
					invalidValue: false,
				});

				/**
				 * const defaultMapping = {
				 *	'rocket.chat': {
				 *      Enabled: true,
				 *		Exchange_Url: 'https://owa.dev.rocket.chat/',
				 *		Outlook_Url: 'https://owa.dev.rocket.chat/owa/#path=/calendar'
				 *	},
				 * };
				 */
				await this.add('Outlook_Calendar_Url_Mapping', '{}', {
					type: 'code',
					multiline: true,
					public: true,
					code: 'application/json',
					invalidValue: '{}',
				});
			},
		);
	});
}
