import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): void {
	void settingsRegistry.addGroup('Outlook_Calendar', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['outlook-calendar'],
			},
			async function () {
				await this.section('Enterprise_Calendar_Server', async function () {
					await this.add('Enterprise_Calendar_Enabled', false, {
						type: 'boolean',
						public: false,
						invalidValue: false,
					});

					await this.add('Enterprise_Calendar_Graph_Cloud', 'global', {
						type: 'select',
						public: false,
						invalidValue: 'global',
						values: [
							{ key: 'global', i18nLabel: 'Enterprise_Calendar_Cloud_Global' },
							{ key: 'us-gov', i18nLabel: 'Enterprise_Calendar_Cloud_US_Gov' },
							{ key: 'us-gov-dod', i18nLabel: 'Enterprise_Calendar_Cloud_US_Gov_DoD' },
							{ key: 'china', i18nLabel: 'Enterprise_Calendar_Cloud_China' },
						],
					});

					await this.add('Enterprise_Calendar_Graph_Tenant_Id', '', { type: 'string', public: false, invalidValue: '' });
					await this.add('Enterprise_Calendar_Graph_Client_Id', '', { type: 'string', public: false, invalidValue: '' });
					await this.add('Enterprise_Calendar_Graph_Credential_Type', 'certificate', {
						type: 'select',
						public: false,
						invalidValue: 'certificate',
						values: [
							{ key: 'certificate', i18nLabel: 'Enterprise_Calendar_Credential_Certificate' },
							{ key: 'client-secret', i18nLabel: 'Enterprise_Calendar_Credential_Client_Secret' },
						],
					});
					await this.add('Enterprise_Calendar_Graph_Client_Secret', '', {
						type: 'password',
						secret: true,
						public: false,
						invalidValue: '',
						readonly: true,
					});
					await this.add('Enterprise_Calendar_Graph_Certificate', '', {
						type: 'password',
						secret: true,
						public: false,
						invalidValue: '',
						readonly: true,
					});
					await this.add('Enterprise_Calendar_Graph_Private_Key', '', {
						type: 'password',
						secret: true,
						public: false,
						invalidValue: '',
						readonly: true,
					});
					await this.add('Enterprise_Calendar_Graph_Webhook_Enabled', false, {
						type: 'boolean',
						public: false,
						invalidValue: false,
					});
					await this.add('Enterprise_Calendar_Graph_Webhook_Url', '', { type: 'string', public: false, invalidValue: '' });
					await this.add('Enterprise_Calendar_Graph_Webhook_Client_State', '', {
						type: 'password',
						secret: true,
						public: false,
						invalidValue: '',
						readonly: true,
					});
					await this.add('Enterprise_Calendar_Sync_Past_Hours', 1, { type: 'int', public: false, invalidValue: 1 });
					await this.add('Enterprise_Calendar_Sync_Future_Days', 14, { type: 'int', public: false, invalidValue: 14 });
					await this.add('Enterprise_Calendar_Max_Users_Per_Run', 100, { type: 'int', public: false, invalidValue: 100 });
					await this.add('Enterprise_Calendar_Include_All_Day', false, { type: 'boolean', public: false, invalidValue: false });
					await this.add('Enterprise_Calendar_Include_Tentative', false, { type: 'boolean', public: false, invalidValue: false });
					await this.add('Enterprise_Calendar_Include_Working_Elsewhere', false, {
						type: 'boolean',
						public: false,
						invalidValue: false,
					});
					await this.add('Enterprise_Calendar_Mailbox_Mappings', '[]', {
						type: 'code',
						multiline: true,
						public: false,
						code: 'application/json',
						invalidValue: '[]',
					});
				});

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
