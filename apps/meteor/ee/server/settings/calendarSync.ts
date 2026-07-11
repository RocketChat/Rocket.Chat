import { settingsRegistry } from '../../../app/settings/server';

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

					await this.add('CalendarSync_Graph_ClientSecret', '', {
						type: 'password',
						secret: true,
						invalidValue: '',
						enableQuery: graphQuery,
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
