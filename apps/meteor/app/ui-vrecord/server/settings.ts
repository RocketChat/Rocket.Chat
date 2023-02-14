import { settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('Message', function () {
	this.add('Message_VideoRecorderEnabled', true, {
		type: 'boolean',
		public: true,
		i18nDescription: 'Message_VideoRecorderEnabledDescription',
	});
});
