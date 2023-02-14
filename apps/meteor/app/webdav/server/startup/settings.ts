import { settingsRegistry } from '../../../settings/server';

settingsRegistry.addGroup('Webdav Integration', function () {
	this.add('Webdav_Integration_Enabled', false, {
		type: 'boolean',
		public: true,
	});
});
