import { settingsRegistry } from '../../app/settings/server';

export const createWebDavSettings = () =>
	settingsRegistry.addGroup('Webdav Integration', async function () {
		await this.add('Webdav_Integration_Enabled', false, {
			type: 'boolean',
			public: true,
		});
	});
