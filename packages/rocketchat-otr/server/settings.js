import { settings } from 'meteor/rocketchat:settings';

settings.addGroup('OTR', function() {
	this.add('OTR_Enable', true, {
		type: 'boolean',
		i18nLabel: 'Enabled',
		public: true,
	});
});
