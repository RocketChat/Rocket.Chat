import bannersConfigSchema from '@rocket.chat/abac/docs/classification-banners.schema.json';

import { settingsRegistry } from '../../../server/settings';

const abacEnabledQuery = { _id: 'ABAC_Enabled', value: true };
const virtruPdpQuery = [abacEnabledQuery, { _id: 'ABAC_PDP_Type', value: 'virtru' }];
const localPdpQuery = [abacEnabledQuery, { _id: 'ABAC_PDP_Type', value: 'local' }];

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
				await this.add('ABAC_Required_Attributes', [], {
					type: 'multiLookup',
					lookupEndpoint: 'v1/abac/attribute-keys',
					public: true,
					invalidValue: [],
					section: 'ABAC',
					i18nDescription: 'ABAC_Required_Attributes_Description',
					enableQuery: abacEnabledQuery,
				});
				// TODO(ABAC-P4/D13): `general` is public, attribute-less and `default: true`, so under
				// enforcement it is locked while `addUserToDefaultChannels` still subscribes every new
				// user into it — that file only skips rooms which *have* attributes. The plain rule is
				// implemented here (locked room, still auto-joined) because auto-join is explicitly out
				// of scope; whether `general` is exempted, has its `default` flag cleared at rollout, or
				// a locked landing room is acceptable is still open.
				await this.add('ABAC_Enforce_All_Rooms', false, {
					type: 'boolean',
					public: true,
					// Losing the license must never leave rooms locked.
					invalidValue: false,
					section: 'ABAC',
					i18nDescription: 'ABAC_Enforce_All_Rooms_Description',
					enableQuery: abacEnabledQuery,
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
					alert: 'ABAC_PDP_Type_Switch_Alert',
					enableQuery: abacEnabledQuery,
				});
				await this.add('ABAC_Attribute_Store', 'local', {
					type: 'select',
					public: true,
					section: 'ABAC_Virtru_PDP_Configuration',
					invalidValue: 'local',
					values: [
						{ key: 'local', i18nLabel: 'ABAC_Attribute_Store_Local' },
						{ key: 'virtru', i18nLabel: 'ABAC_Attribute_Store_Virtru' },
					],
					i18nDescription: 'ABAC_Attribute_Store_Description',
					alert: 'ABAC_Attribute_Store_Switch_Alert',
					enableQuery: virtruPdpQuery,
				});
				// ABAC-P4/D12 — default on, and only meaningful for the local PDP: under Virtru the
				// equivalent filtering is performed by the PDP via GetEntitlements.
				await this.add('ABAC_Restrict_To_Owned_Attributes', true, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					section: 'ABAC',
					i18nDescription: 'ABAC_Restrict_To_Owned_Attributes_Description',
					enableQuery: localPdpQuery,
				});
				await this.add('ABAC_ShowAttributesInRooms', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					section: 'ABAC',
					enableQuery: abacEnabledQuery,
				});
				await this.add('ABAC_Classification_Banners_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					section: 'ABAC_Classification_Banners',
					enableQuery: abacEnabledQuery,
					i18nDescription: 'ABAC_Classification_Banners_Enabled_Description',
				});
				await this.add('ABAC_Classification_Banners_Config', '', {
					type: 'code',
					code: 'application/json',
					multiline: true,
					public: true,
					invalidValue: '',
					section: 'ABAC_Classification_Banners',
					enableQuery: [abacEnabledQuery, { _id: 'ABAC_Classification_Banners_Enabled', value: true }],
					i18nDescription: 'ABAC_Classification_Banners_Config_Description',
					schema: bannersConfigSchema,
				});
				// ABAC-P4/D10 — captures the value of `Discussion_enabled` at the moment enforcement is
				// switched on, so it can be restored verbatim when enforcement is switched off.
				// '' means "no override in effect"; otherwise 'true' | 'false'. Server-only: hidden
				// settings are filtered out of both settings endpoints and never reach a client.
				await this.add('ABAC_Discussion_Enabled_Restore', '', {
					type: 'string',
					public: false,
					hidden: true,
					invalidValue: '',
					section: 'ABAC',
				});
				await this.add('Abac_Cache_Decision_Time_Seconds', 300, {
					type: 'int',
					public: true,
					section: 'ABAC',
					invalidValue: 0,
					enableQuery: abacEnabledQuery,
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
					i18nDescription: 'ABAC_Virtru_OIDC_Endpoint_Description',
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
				await this.add('ABAC_Virtru_Sync_Interval', '*/5 * * * *', {
					type: 'string',
					public: false,
					invalidValue: '*/5 * * * *',
					section: 'ABAC_Virtru_PDP_Configuration',
					i18nDescription: 'ABAC_Virtru_Sync_Interval_Description',
					enableQuery: virtruPdpQuery,
				});
				await this.add(
					'ABAC_Virtru_Test_Connection',
					{ method: 'GET', path: '/v1/abac/pdp/health' },
					{
						type: 'action',
						actionText: 'ABAC_Virtru_Test_Connection_Action',
						invalidValue: '',
						section: 'ABAC_Virtru_PDP_Configuration',
						enableQuery: virtruPdpQuery,
					},
				);
			},
		);
	});
}
