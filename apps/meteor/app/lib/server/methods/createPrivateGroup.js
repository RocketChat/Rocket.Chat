import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { createRoom } from '../functions';

Meteor.methods({
	createPrivateGroup(name, members, readOnly = false, customFields = {}, extraData = {}) {
		check(name, String);
		check(members, Match.Optional([String]));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createPrivateGroup',
			});
		}

		if (!hasPermission(Meteor.userId(), 'create-p')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
		}

		return createRoom('p', name, Meteor.user() && Meteor.user().username, members, readOnly, {
			customFields,
			...extraData,
		});
	},
});
