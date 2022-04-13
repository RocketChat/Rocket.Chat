import { settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('Threads', function () {
	this.add('Threads_enabled', true, {
		group: 'Threads',
		i18nLabel: 'Enable',
		type: 'boolean',
		public: true,
	});
	this.add('Also_send_to_channel_by_default', true, {
		group: 'Threads',
		type: 'boolean',
		public: true,
	});
});
