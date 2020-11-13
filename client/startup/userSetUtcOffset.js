import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { utcOffsetDate, getDate } from '../../lib/rocketchat-dates';
import { Users } from '../../app/models';

Meteor.startup(function() {
	Tracker.autorun(function() {
		const user = Users.findOne({ _id: Meteor.userId() }, { fields: { statusConnection: 1, utcOffset: 1 } });
		if (user && user.statusConnection === 'online') {
			const utcOffset = utcOffsetDate(getDate()) / 60;
			if (user.utcOffset !== utcOffset) {
				Meteor.call('userSetUtcOffset', utcOffset);
			}
		}
	});
});
