import { settingsRegistry } from '../../app/settings/server';

export const createFederationServiceSettings = async (): Promise<void> => {
	await settingsRegistry.addGroup('Federation Service', async function () {
		await this.add('Federation_Service_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Federation_Service_Enabled',
			i18nDescription: 'Federation_Service_Enabled_Description',
			public: true,
			alert: 'Federation_Service_Alert',
		});
	});
};
