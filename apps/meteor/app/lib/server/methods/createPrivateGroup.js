import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { createRoom } from '../functions';

Meteor.methods({
	async createPrivateGroup(name, members, readOnly = false, customFields = {}, extraData = {}) {
		check(name, String);
		check(members, Match.Optional([String]));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createPrivateGroup',
			});
		}

		if (!await hasPermissionAsync(Meteor.userId(), 'create-p')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
		}

		return createRoom('p', name, Meteor.user() && Meteor.user().username, members, readOnly, {
			customFields,
			...extraData,
		});
	},
});
