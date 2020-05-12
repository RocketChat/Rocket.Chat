import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';
import './cors';

Meteor.startup(function() {
	settings.onload('Force_SSL', function(key, value) {
		Meteor.absoluteUrl.defaultOptions.secure = value;
	});
});
