import { settingsRegistry } from '../../../settings/server';

await settingsRegistry.addGroup('Webdav Integration', async function () {
	await this.add('Webdav_Integration_Enabled', false, {
		type: 'boolean',
		public: true,
	});
});
