import { settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('OTR', function () {
	this.add('OTR_Enable', true, {
		type: 'boolean',
		i18nLabel: 'Enabled',
		public: true,
	});
	this.add('OTR_Count', 0, {
		type: 'int',
		hidden: true,
	});
});
