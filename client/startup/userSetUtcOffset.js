import moment from 'moment';

Meteor.startup(function() {
	Tracker.autorun(function() {
		const user = Meteor.user();
		if (user && user.statusConnection === 'online') {
			const utcOffset = moment().utcOffset() / 60;
			if (user.utcOffset !== utcOffset) {
				Meteor.call('userSetUtcOffset', utcOffset);
			}
		}
	});
});
