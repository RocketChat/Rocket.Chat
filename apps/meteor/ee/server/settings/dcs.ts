import { settingsRegistry } from '../../../server/settings';

const dcsEnabledQuery = { _id: 'DCS_Enabled', value: true };

export function addSettings(): Promise<void> {
	return settingsRegistry.addGroup('General', async function () {
		await this.with(
			{
				enterprise: true,
				modules: ['abac'],
			},
			async function () {
				await this.add('DCS_Enabled', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					section: 'Data_centric_security',
					i18nDescription: 'DCS_Enabled_Description',
				});
				await this.add('DCS_Policy', '', {
					type: 'string',
					multiline: true,
					invalidValue: '',
					section: 'Data_centric_security',
					i18nDescription: 'DCS_Policy_Description',
					enableQuery: dcsEnabledQuery,
				});
				await this.add('DCS_Catalog', '[]', {
					type: 'code',
					code: 'application/json',
					invalidValue: '[]',
					section: 'Data_centric_security',
					i18nDescription: 'DCS_Catalog_Description',
					enableQuery: dcsEnabledQuery,
				});
			},
		);
	});
}
