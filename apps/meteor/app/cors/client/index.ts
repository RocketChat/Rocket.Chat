import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings/client';

Meteor.startup(function () {
	Tracker.autorun(function () {
		Meteor.absoluteUrl.defaultOptions.secure = Boolean(settings.get('Force_SSL'));
	});
});
