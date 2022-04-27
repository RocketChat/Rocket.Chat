import './cors';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';

Meteor.startup(function () {
	settings.watch('Force_SSL', (value) => {
		Meteor.absoluteUrl.defaultOptions.secure = Boolean(value);
	});
});
