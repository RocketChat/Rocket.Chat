import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { createRoom } from '../functions';

Meteor.methods({
	createChannel(name, members, readOnly = false, customFields = {}, extraData = {}) {
		check(name, String);
		check(members, Match.Optional([String]));

		const uid = Meteor.userId();

		const user = Meteor.user();

		if (!uid || !user?.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
		}

		if (!hasPermission(uid, 'create-c')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createChannel' });
		}
		return createRoom('c', name, user.username, members, readOnly, {
			customFields,
			...extraData,
		});
	},
});
