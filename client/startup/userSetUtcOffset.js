import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Users } from 'meteor/rocketchat:models';
import moment from 'moment';

Meteor.startup(function() {
	Tracker.autorun(function() {
		const user = Users.findOne({ _id: Meteor.userId() }, { fields: { statusConnection: 1, utcOffset: 1 } });
		if (user && user.statusConnection === 'online') {
			const utcOffset = moment().utcOffset() / 60;
			if (user.utcOffset !== utcOffset) {
				Meteor.call('userSetUtcOffset', utcOffset);
			}
		}
	});
});
