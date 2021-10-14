import { settingsRegister } from '../../settings/server';

settingsRegister.addGroup('Message', function() {
	this.add('Message_VideoRecorderEnabled', true, {
		type: 'boolean',
		public: true,
		i18nDescription: 'Message_VideoRecorderEnabledDescription',
	});
});
