import { settingsRegister } from '../../settings/server';

settingsRegister.addGroup('Threads', function() {
	this.add('Threads_enabled', true, {
		group: 'Threads',
		i18nLabel: 'Enable',
		type: 'boolean',
		public: true,
	});
});
