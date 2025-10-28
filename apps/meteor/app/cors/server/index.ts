import './cors';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings/server';

Meteor.startup(() => {
	settings.watch<boolean>('Force_SSL', (value) => {
		Meteor.absoluteUrl.defaultOptions.secure = Boolean(value);
	});
});
