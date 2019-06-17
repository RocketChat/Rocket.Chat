import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';
import { initializeNewsfeed } from './initialize';
import { deinitializeNewsfeed } from './deinitialize';

const defaults = {
	enable: false,
};

Meteor.startup(() => {
	settings.addGroup('Newsfeed', function() {
		this.add('Newsfeed_enabled', defaults.enable, {
			type: 'boolean',
			i18nLabel: 'Enable',
			public: true,
		});
	});
});

settings.get('Newsfeed_enabled', (key, value) => {
	if (value === true) {
		initializeNewsfeed();
	} else {
		deinitializeNewsfeed();
	}
});
