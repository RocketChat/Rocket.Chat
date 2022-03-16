import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { createRoom } from '../functions';

Meteor.methods({
	createPrivateGroup(name, members, readOnly = false, customFields = {}, extraData = {}) {
		check(name, String);
		check(members, Match.Optional([String]));

		const user = Meteor.user();

		if (!user || !user.username) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createPrivateGroup',
			});
		}

		if (!hasPermission(user._id, 'create-p')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createPrivateGroup' });
		}

		// validate extra data schema
		check(
			extraData,
			Match.ObjectIncluding({
				tokenpass: Match.Maybe({
					require: String,
					tokens: [
						{
							token: String,
							balance: String,
						},
					],
				}),
			}),
		);

		return createRoom('p', name, user.username, members, readOnly, {
			customFields,
			...extraData,
		});
	},
});
