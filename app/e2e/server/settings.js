import { settings } from '../../settings';

settings.addGroup('E2E Encryption', function() {
	this.add('E2E_Enable', false, {
		type: 'boolean',
		i18nLabel: 'Enabled',
		i18nDescription: 'E2E_Enable_description',
		public: true,
		alert: 'E2E_Enable_alert',
	});

	this.add('E2E_Enabled_Default_DirectRooms', false, {
		type: 'boolean',
		enableQuery: { _id: 'E2E_Enable', value: true },
	});

	this.add('E2E_Enabled_Default_PrivateRooms', false, {
		type: 'boolean',
		enableQuery: { _id: 'E2E_Enable', value: true },
	});
});
