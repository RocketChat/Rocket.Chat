import { settingsRegistry } from '../../../app/settings/server';

const abacEnabledQuery = { _id: 'ABAC_Enabled', value: true };
const virtruPdpQuery = [abacEnabledQuery, { _id: 'ABAC_PDP_Type', value: 'virtru' }];

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('General', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['abac'],
			},
			async function () {
				await this.add('ABAC_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					section: 'ABAC',
					i18nDescription: 'ABAC_Enabled_Description',
				});
				await this.add('ABAC_PDP_Type', 'local', {
					type: 'select',
					public: true,
					section: 'ABAC',
					invalidValue: 'local',
					values: [
						{ key: 'local', i18nLabel: 'ABAC_PDP_Type_Local' },
						{ key: 'virtru', i18nLabel: 'ABAC_PDP_Type_Virtru' },
					],
					enableQuery: abacEnabledQuery,
				});
				await this.add('ABAC_ShowAttributesInRooms', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					section: 'ABAC',
					enableQuery: abacEnabledQuery,
				});
				await this.add('Abac_Cache_Decision_Time_Seconds', 300, {
					type: 'int',
					public: true,
					section: 'ABAC',
					invalidValue: 0,
					enableQuery: [abacEnabledQuery, { _id: 'ABAC_PDP_Type', value: 'local' }],
				});

				// Virtru PDP Configuration
				await this.add('ABAC_Virtru_Base_URL', '', {
					type: 'string',
					public: false,
					invalidValue: '',
					section: 'ABAC_Virtru_PDP_Configuration',
					enableQuery: virtruPdpQuery,
				});
				await this.add('ABAC_Virtru_Client_ID', '', {
					type: 'string',
					public: false,
					invalidValue: '',
					section: 'ABAC_Virtru_PDP_Configuration',
					enableQuery: virtruPdpQuery,
				});
				await this.add('ABAC_Virtru_Client_Secret', '', {
					type: 'password',
					public: false,
					invalidValue: '',
					section: 'ABAC_Virtru_PDP_Configuration',
					enableQuery: virtruPdpQuery,
				});
				await this.add('ABAC_Virtru_OIDC_Endpoint', '', {
					type: 'string',
					public: false,
					invalidValue: '',
					section: 'ABAC_Virtru_PDP_Configuration',
					enableQuery: virtruPdpQuery,
				});
				await this.add('ABAC_Virtru_Default_Entity_Key', 'emailAddress', {
					type: 'select',
					public: false,
					invalidValue: 'emailAddress',
					section: 'ABAC_Virtru_PDP_Configuration',
					i18nDescription: 'ABAC_Virtru_Default_Entity_Key_Description',
					values: [
						{ key: 'emailAddress', i18nLabel: 'ABAC_Virtru_Entity_Key_Email' },
						{ key: 'oidcIdentifier', i18nLabel: 'ABAC_Virtru_Entity_Key_OIDC' },
					],
					enableQuery: virtruPdpQuery,
				});
				await this.add('ABAC_Virtru_Attribute_Namespace', 'example.com', {
					type: 'string',
					public: false,
					invalidValue: 'example.com',
					section: 'ABAC_Virtru_PDP_Configuration',
					i18nDescription: 'ABAC_Virtru_Attribute_Namespace_Description',
					enableQuery: virtruPdpQuery,
				});
				await this.add('ABAC_Virtru_Sync_Interval', 'every_24_hours', {
					type: 'select',
					public: false,
					invalidValue: 'every_24_hours',
					section: 'ABAC_Virtru_PDP_Configuration',
					values: [
						{ key: 'every_1_hour', i18nLabel: 'every_hour' },
						{ key: 'every_6_hours', i18nLabel: 'every_six_hours' },
						{ key: 'every_12_hours', i18nLabel: 'every_12_hours' },
						{ key: 'every_24_hours', i18nLabel: 'every_24_hours' },
					],
					enableQuery: virtruPdpQuery,
				});
			},
		);
	});
}
