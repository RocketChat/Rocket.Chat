import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(function() {
	settings.get('Force_SSL', (value) => {
		Meteor.absoluteUrl.defaultOptions.secure = Boolean(value);
	});
});
