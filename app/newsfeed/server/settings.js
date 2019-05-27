import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

const defaults = {
	enable: true,
};

Meteor.startup(() => {
	settings.addGroup('Newsfeed', function() {
		this.add('Newsfeed_enable', defaults.enable, {
			type: 'boolean',
			i18nLabel: 'Enable',
		});
	});
});
