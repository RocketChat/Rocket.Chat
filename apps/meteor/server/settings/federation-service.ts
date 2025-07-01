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

		await this.add('Federation_Service_Matrix_Domain', 'localhost', {
			type: 'string',
			i18nLabel: 'Federation_Service_Matrix_Domain',
			i18nDescription: 'Federation_Service_Matrix_Domain_Description',
			public: true,
		});

		await this.add('Federation_Service_Matrix_Port', 3000, {
			type: 'int',
			i18nLabel: 'Federation_Service_Matrix_Port',
			i18nDescription: 'Federation_Service_Matrix_Port_Description',
			public: true,
			alert: 'Federation_Service_Matrix_Port_Alert',
		});
	});
};
