import { settingsRegistry } from '../../app/settings/server';

export const createFederationServiceSettings = async (): Promise<void> => {
	await settingsRegistry.addGroup('Federation', async function () {
		await this.section('Federation_Service', async function () {
			await this.add('FEDERATION_Service_Enabled', false, {
				type: 'boolean',
				i18nLabel: 'FEDERATION_Service_Enabled',
				i18nDescription: 'FEDERATION_Service_Enabled_Description',
				public: true,
				alert: 'FEDERATION_Service_Alert',
			});
		});
	});
};