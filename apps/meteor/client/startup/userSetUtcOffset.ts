import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import { Users } from '../../app/models/client';

Meteor.startup(() => {
	Tracker.autorun((c) => {
		const status = Meteor.status();
		if (!status.connected) {
			return;
		}

		if (!Meteor.userId()) {
			return;
		}

		const user = Users.findOne({ _id: Meteor.userId() }, { fields: { utcOffset: 1 } });

		const utcOffset = moment().utcOffset() / 60;

		if (!user) {
			return;
		}
		if (user.utcOffset !== utcOffset) {
			Meteor.call('userSetUtcOffset', utcOffset);
		}
		c.stop();
	});
});
