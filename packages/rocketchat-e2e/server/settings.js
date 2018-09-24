import { RocketChat } from 'meteor/rocketchat:lib';

RocketChat.settings.addGroup('E2E Encryption', function() {
	this.add('E2E_Enable', false, {
		type: 'boolean',
		i18nLabel: 'Enabled',
		public: true,
	});
});
