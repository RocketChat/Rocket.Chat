import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models';
import { getDefaultUserFields } from '../../../utils/server/functions/getDefaultUserFields';

Meteor.publish('userServiceAccounts', function() {
	if (!this.userId) {
		return this.ready();
	}

	if (Meteor.user().u) {
		return this.ready();
	}
	const handle = Users.find({ 'u._id': this.userId, active: true }, {
		fields: getDefaultUserFields(),
	}).observeChanges({
		added: (_id, record) => this.added('rocketchat_full_user', _id, record),
		changed: (_id, record) => this.changed('rocketchat_full_user', _id, record),
		removed: (_id, record) => this.removed('rocketchat_full_user', _id, record),
	});

	this.ready();

	this.onStop(() => handle.stop());
});
