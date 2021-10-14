import { settingsRegister } from '../../settings/server';

settingsRegister.addGroup('OTR', function() {
	this.add('OTR_Enable', true, {
		type: 'boolean',
		i18nLabel: 'Enabled',
		public: true,
	});
});
