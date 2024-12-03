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
			const enableQuery = { _id: 'PiwikAnalytics_enabled', value: true };
			this.add('Redis_url', 'localhost', {
				type: 'string',
				public: false,
				i18nLabel: 'Redis URL',
			});
			this.add('PiwikAnalytics_url', '', {
				type: 'string',
				public: true,
				i18nLabel: 'URL',
				enableQuery,
			});
		});
	});
});
