import moment from 'moment';

Meteor.startup(function() {
	Tracker.autorun(function() {
		var user, utcOffset;
		user = Meteor.user();
		if (user && user.statusConnection === 'online') {
			utcOffset = moment().utcOffset() / 60;
			if (user.utcOffset !== utcOffset) {
				Meteor.call('userSetUtcOffset', utcOffset);
			}
		}
	});
});
