import { settingsRegistry } from '../../../app/settings/server';

export function addSettings(): void {
	void settingsRegistry.addGroup('General', async function () {
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
				await this.add('ABAC_ShowAttributesInRooms', false, {
					type: 'boolean',
					public: true,
					invalidValue: false,
					section: 'ABAC',
					enableQuery: { _id: 'ABAC_Enabled', value: true },
				});
			},
		);
	});
}
