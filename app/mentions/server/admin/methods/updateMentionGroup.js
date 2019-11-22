import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { hasPermission } from '../../../../authorization';
import { MentionGroups, Users } from '../../../../models';

Meteor.methods({
	updateMentionGroup(group, id) {
		if (!hasPermission(this.userId, 'manage-mention-groups')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'updateMentionGroup' });
		}
		if (!_.isString(group.name) || group.name.trim() === '') {
			throw new Meteor.Error('error-invalid-name', 'Invalid name', { method: 'updateMentionGroup' });
		}
		if (!_.isBoolean(group.userCanJoin) || !_.isBoolean(group.mentionsOffline)) {
			throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', { method: 'updateMentionGroup' });
		}
		const currentGroup = MentionGroups.findOne(id);
		if (currentGroup == null) {
			throw new Meteor.Error('error-not-found', 'Group not found', { method: 'updateMentionGroup' });
		}

		MentionGroups.update(id, {
			$set: {
				name: group.name.trim(),
				userCanJoin: group.userCanJoin,
				mentionsOffline: group.mentionsOffline,
				mentionsOutside: group.mentionsOutside,
				users: group.users,
				groups: group.groups,
				channels: group.channels,
				roles: group.roles,
				description: group.description,
				_updatedAt: new Date(),
				_updatedBy: Users.findOne(this.userId, {
					fields: {
						username: 1,
					},
				}),
			},
		});
		return MentionGroups.findOne(id);
	},
});
