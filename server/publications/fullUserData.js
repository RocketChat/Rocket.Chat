import { Meteor } from 'meteor/meteor';

import { getFullUserData } from '../../app/lib';

Meteor.publish('fullUserData', function(filter, limit) {
	if (!this.userId) {
		return this.ready();
	}

	const handle = getFullUserData({
		userId: this.userId,
		filter,
		limit,
	}).observeChanges({
		added: (id, fields) => {
			this.added('rocketchat_full_user', id, fields);
		},

		changed: (id, fields) => {
			this.changed('rocketchat_full_user', id, fields);
		},

		removed: (id) => {
			this.removed('rocketchat_full_user', id);
		},
	});

	this.ready();
	this.onStop(() => handle.stop());
});
