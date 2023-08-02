import { settingsRegistry } from '../../app/settings/server';

export const createOTRSettings = () =>
	settingsRegistry.addGroup('OTR', async function () {
		await this.add('OTR_Enable', true, {
			type: 'boolean',
			i18nLabel: 'Enabled',
			public: true,
		});
		await this.add('OTR_Count', 0, {
			type: 'int',
			hidden: true,
		});
	});
