import { Meteor } from 'meteor/meteor';

import { settings } from '../settings';

Meteor.startup(() => {
	settings.addGroup('Real Time Architecture', function addSettings() {
		this.add('Use_Oplog_As_Real_Time', true, {
			type: 'boolean',
			public: false,
			i18nLabel: 'Should Use Default Oplog Observing or the new Architecure',
		});
		this.section('Redis', function() {
			this.add('Redis_url', 'localhost', {
				type: 'string',
				public: false,
				i18nLabel: 'Redis URL',
			});
			this.add('Delay_On_Client_Disconnection', 3000, {
				type: 'int',
				public: false,
				i18nLabel: 'Remove binding on client disconnection in ms',
				i18nDescription: 'Remove binding on client disconnection To prevent unsub/sub unneccesary on client refreshes',
			});
		});
	});
});
