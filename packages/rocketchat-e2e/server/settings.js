import { settings } from 'meteor/rocketchat:settings';

settings.addGroup('E2E Encryption', function() {
	this.add('E2E_Enable', false, {
		type: 'boolean',
		i18nLabel: 'Enabled',
		i18nDescription: 'E2E_Enable_description',
		public: true,
		alert: 'E2E_Enable_alert',
	});
});
