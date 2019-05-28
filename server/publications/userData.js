import { Meteor } from 'meteor/meteor';

import { Users } from '../../app/models';
import { getDefaultUserFields } from '../../app/utils/server/functions/getDefaultUserFields';

Meteor.publish('userData', function() {
	if (!this.userId) {
		return this.ready();
	}

	const handle = Users.find({ _id: this.userId }, {
		fields: getDefaultUserFields(),
	}).observeChanges({
		added: (_id, record) => this.added('own_user', _id, record),
		changed: (_id, record) => this.changed('own_user', _id, record),
		removed: (_id, record) => this.removed('own_user', _id, record),
	});

	this.ready();

	this.onStop(() => handle.stop());
});
