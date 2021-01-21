import { settings } from '../../settings';

settings.addGroup('Unleavable Channels', function() {
	this.add('Not_Cl_Enable', false, {
		type: 'boolean',
		i18nLabel: 'Enabled',
		i18nDescription: 'Not_Cl_Enable_description',
		public: true,
	});
});
