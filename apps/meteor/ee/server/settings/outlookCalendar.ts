import { settingsRegistry } from '../../../server/settings';

const enabled = { _id: 'Outlook_Calendar_Enabled', value: true };

const legacyOnly = [enabled, { _id: 'Outlook_Calendar_Mode', value: 'legacy' }];
const serverOnly = [enabled, { _id: 'Outlook_Calendar_Mode', value: 'server' }];

const graphOnly = [...serverOnly, { _id: 'Outlook_Calendar_Server_Sync_Provider', value: 'graph' }];
const ewsOnly = [...serverOnly, { _id: 'Outlook_Calendar_Server_Sync_Provider', value: 'ews' }];

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

				await this.add('Outlook_Calendar_Mode', 'legacy', {
					type: 'select',
					public: true,
					invalidValue: 'legacy',
					alert: 'Outlook_Calendar_Mode_Legacy_Warning',
					values: [
						{ key: 'legacy', i18nLabel: 'Outlook_Calendar_Mode_Legacy' },
						{ key: 'server', i18nLabel: 'Outlook_Calendar_Mode_Server' },
					],
					enableQuery: { _id: 'Outlook_Calendar_Enabled', value: true },
				});

				await this.section('Outlook_Calendar_Legacy', async function () {
					await this.add('Outlook_Calendar_Exchange_Url', '', {
						type: 'string',
						public: true,
						invalidValue: '',
						placeholder: 'https://exchange.example.com/',
						enableQuery: legacyOnly,
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
						enableQuery: legacyOnly,
					});
				});

				await this.section('Outlook_Calendar_Server_Sync', async function () {
					await this.add('Outlook_Calendar_Server_Sync_Provider', 'graph', {
						type: 'select',
						values: [
							{ key: 'graph', i18nLabel: 'Outlook_Calendar_Server_Sync_Provider_Graph' },
							{ key: 'ews', i18nLabel: 'Outlook_Calendar_Server_Sync_Provider_EWS' },
						],
						enableQuery: serverOnly,
						invalidValue: 'graph',
					});

					await this.add('Outlook_Calendar_Server_Sync_Interval', 15, {
						type: 'int',
						enableQuery: serverOnly,
						invalidValue: 15,
					});

					await this.add('Outlook_Calendar_Server_Sync_Window_Hours', 48, {
						type: 'int',
						enableQuery: serverOnly,
						invalidValue: 48,
					});

					// Empty means the verified Rocket.Chat email, matching `getUserCalendar`.
					await this.add('Outlook_Calendar_Server_Sync_Mailbox_Field', '', {
						type: 'string',
						enableQuery: serverOnly,
						placeholder: 'mail',
						invalidValue: '',
					});
				});

				await this.section('Outlook_Calendar_Server_Sync_Graph', async function () {
					await this.add('Outlook_Calendar_Graph_Tenant_Id', '', {
						type: 'string',
						enableQuery: graphOnly,
						placeholder: 'contoso.onmicrosoft.com',
						invalidValue: '',
					});

					await this.add('Outlook_Calendar_Graph_Client_Id', '', {
						type: 'string',
						enableQuery: graphOnly,
						invalidValue: '',
					});

					await this.add('Outlook_Calendar_Graph_Client_Secret', '', {
						type: 'password',
						secret: true,
						autocomplete: false,
						enableQuery: graphOnly,
						invalidValue: '',
					});

					await this.add('Outlook_Calendar_Graph_Authority_Host', 'https://login.microsoftonline.com', {
						type: 'string',
						enableQuery: graphOnly,
						invalidValue: '',
					});

					await this.add('Outlook_Calendar_Graph_Host', 'https://graph.microsoft.com', {
						type: 'string',
						enableQuery: graphOnly,
						invalidValue: '',
					});
				});

				await this.section('Outlook_Calendar_Server_Sync_EWS', async function () {
					await this.add('Outlook_Calendar_EWS_Url', '', {
						type: 'string',
						enableQuery: ewsOnly,
						placeholder: 'https://exchange.example.com/EWS/Exchange.asmx',
						invalidValue: '',
					});

					// The service account holding `ApplicationImpersonation`, not an end user's account.
					await this.add('Outlook_Calendar_EWS_Username', '', {
						type: 'string',
						enableQuery: ewsOnly,
						placeholder: 'CORP\\svc-rocketchat',
						invalidValue: '',
					});

					await this.add('Outlook_Calendar_EWS_Password', '', {
						type: 'password',
						secret: true,
						autocomplete: false,
						enableQuery: ewsOnly,
						invalidValue: '',
					});

					await this.add('Outlook_Calendar_EWS_Auth_Method', 'ntlm', {
						type: 'select',
						values: [
							{ key: 'ntlm', i18nLabel: 'Outlook_Calendar_EWS_Auth_Method_NTLM' },
							{ key: 'basic', i18nLabel: 'Outlook_Calendar_EWS_Auth_Method_Basic' },
						],
						enableQuery: ewsOnly,
						invalidValue: 'ntlm',
					});

					// An opt-in for a private authority
					await this.add('Outlook_Calendar_EWS_CA_Cert', '', {
						type: 'string',
						multiline: true,
						secret: true,
						enableQuery: ewsOnly,
						invalidValue: '',
					});

					await this.add('Outlook_Calendar_EWS_Reject_Unauthorized', true, {
						type: 'boolean',
						enableQuery: ewsOnly,
						invalidValue: true,
					});
				});
			},
		);
	});
}
