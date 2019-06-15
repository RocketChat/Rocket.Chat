import { Meteor } from 'meteor/meteor';

import { Users } from '../../../models';

Meteor.publish('fullServiceAccountData', function() {
	if (!this.userId) {
		return this.ready();
	}

	const query = {
		u: {
			$exists: true,
		},
		active: false,
	};

	const handle = Users.find(query, {}).observeChanges({
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
