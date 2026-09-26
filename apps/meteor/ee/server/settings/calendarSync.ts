import { settingsRegistry } from '../../../server/settings';

export function addSettings(): void {
	void settingsRegistry.addGroup('Calendar_Sync', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['outlook-calendar'],
			},
			async function () {
				await this.add('CalendarSync_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
				});

				await this.add('CalendarSync_Provider', 'microsoft-graph', {
					type: 'select',
					values: [
						{ key: 'microsoft-graph', i18nLabel: 'CalendarSync_Provider_Microsoft_Graph' },
						{ key: 'exchange-ews', i18nLabel: 'CalendarSync_Provider_Exchange_EWS' },
					],
					invalidValue: 'microsoft-graph',
					enableQuery: { _id: 'CalendarSync_Enabled', value: true },
				});

				await this.add('CalendarSync_Mode', 'full-events', {
					type: 'select',
					values: [
						{ key: 'full-events', i18nLabel: 'CalendarSync_Mode_Full_Events' },
						{ key: 'free-busy-only', i18nLabel: 'CalendarSync_Mode_Free_Busy_Only' },
					],
					invalidValue: 'full-events',
					enableQuery: { _id: 'CalendarSync_Enabled', value: true },
				});

				await this.section('CalendarSync_Section_Microsoft_Graph', async function () {
					const graphQuery = { _id: 'CalendarSync_Provider', value: 'microsoft-graph' };

					await this.add('CalendarSync_Graph_Cloud', 'commercial', {
						type: 'select',
						values: [
							{ key: 'commercial', i18nLabel: 'CalendarSync_Graph_Cloud_Commercial' },
							{ key: 'gcc-high', i18nLabel: 'CalendarSync_Graph_Cloud_GccHigh' },
							{ key: 'dod', i18nLabel: 'CalendarSync_Graph_Cloud_Dod' },
						],
						invalidValue: 'commercial',
						enableQuery: graphQuery,
					});

					await this.add('CalendarSync_Graph_TenantId', '', {
						type: 'string',
						invalidValue: '',
						enableQuery: graphQuery,
					});

					await this.add('CalendarSync_Graph_ClientId', '', {
						type: 'string',
						invalidValue: '',
						enableQuery: graphQuery,
					});

					await this.add('CalendarSync_Graph_Auth_Method', 'client-secret', {
						type: 'select',
						values: [
							{ key: 'client-secret', i18nLabel: 'CalendarSync_Graph_Auth_Method_Client_Secret' },
							{ key: 'certificate', i18nLabel: 'CalendarSync_Graph_Auth_Method_Certificate' },
						],
						invalidValue: 'client-secret',
						enableQuery: graphQuery,
					});

					await this.add('CalendarSync_Graph_ClientSecret', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
						enableQuery: [graphQuery, { _id: 'CalendarSync_Graph_Auth_Method', value: 'client-secret' }],
					});

					await this.add('CalendarSync_Graph_Certificate', '', {
						type: 'string',
						multiline: true,
						invalidValue: '',
						enableQuery: [graphQuery, { _id: 'CalendarSync_Graph_Auth_Method', value: 'certificate' }],
					});

					await this.add('CalendarSync_Graph_PrivateKey', '', {
						type: 'string',
						multiline: true,
						secret: true,
						invalidValue: '',
						enableQuery: [graphQuery, { _id: 'CalendarSync_Graph_Auth_Method', value: 'certificate' }],
					});
				});

				await this.section('CalendarSync_Section_Exchange_EWS', async function () {
					const ewsQuery = { _id: 'CalendarSync_Provider', value: 'exchange-ews' };

					await this.add('CalendarSync_Ews_Url', '', {
						type: 'string',
						invalidValue: '',
						placeholder: 'https://mail.example.com/EWS/Exchange.asmx',
						enableQuery: ewsQuery,
					});

					await this.add('CalendarSync_Ews_Username', '', {
						type: 'string',
						invalidValue: '',
						placeholder: 'DOMAIN\\serviceaccount',
						enableQuery: ewsQuery,
					});

					await this.add('CalendarSync_Ews_Password', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
						enableQuery: ewsQuery,
					});

					await this.add('CalendarSync_Ews_AuthMethod', 'ntlm', {
						type: 'select',
						values: [
							{ key: 'ntlm', i18nLabel: 'CalendarSync_Ews_AuthMethod_Ntlm' },
							{ key: 'basic', i18nLabel: 'CalendarSync_Ews_AuthMethod_Basic' },
						],
						invalidValue: 'ntlm',
						enableQuery: ewsQuery,
					});
				});

				await this.section('CalendarSync_Section_Schedule', async function () {
					await this.add('CalendarSync_Interval', 5, {
						type: 'int',
						invalidValue: 5,
						enableQuery: { _id: 'CalendarSync_Enabled', value: true },
					});

					await this.add('CalendarSync_Window_Days', 7, {
						type: 'int',
						invalidValue: 7,
						enableQuery: { _id: 'CalendarSync_Enabled', value: true },
					});

					await this.add('CalendarSync_Batch_Size', 10, {
						type: 'int',
						invalidValue: 10,
						enableQuery: { _id: 'CalendarSync_Enabled', value: true },
					});

					await this.add('CalendarSync_Webhooks_Enabled', false, {
						type: 'boolean',
						invalidValue: false,
						enableQuery: [
							{ _id: 'CalendarSync_Enabled', value: true },
							{ _id: 'CalendarSync_Provider', value: 'microsoft-graph' },
						],
					});
				});

				await this.add('CalendarSync_User_Roles', '', {
					type: 'string',
					invalidValue: '',
					enableQuery: { _id: 'CalendarSync_Enabled', value: true },
				});

				await this.add('CalendarSync_Test_Connection', 'calendarSyncTestConnection', {
					type: 'action',
					actionText: 'Test_Connection',
					i18nLabel: 'Test_Connection',
				});

				await this.section('CalendarSync_Section_Mailbox_Mapping', async function () {
					await this.add('CalendarSync_Mailbox_Source', 'email', {
						type: 'select',
						values: [
							{ key: 'email', i18nLabel: 'CalendarSync_Mailbox_Source_Email' },
							{ key: 'custom-field', i18nLabel: 'CalendarSync_Mailbox_Source_Custom_Field' },
						],
						invalidValue: 'email',
						enableQuery: { _id: 'CalendarSync_Enabled', value: true },
					});

					await this.add('CalendarSync_Mailbox_CustomField', '', {
						type: 'string',
						invalidValue: '',
						enableQuery: { _id: 'CalendarSync_Mailbox_Source', value: 'custom-field' },
					});
				});

				await this.section('CalendarSync_Section_Presence', async function () {
					await this.add('CalendarSync_Presence_Enabled', true, {
						type: 'boolean',
						invalidValue: false,
						enableQuery: { _id: 'CalendarSync_Enabled', value: true },
					});
				});
			},
		);
	});
}
