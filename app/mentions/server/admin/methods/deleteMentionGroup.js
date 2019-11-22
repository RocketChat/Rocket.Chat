import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization';
import { MentionGroups } from '../../../../models';

Meteor.methods({
	deleteMentionGroup(groupId) {
		if (!hasPermission(this.userId, 'manage-mention-groups')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteMentionGroup' });
		}
		const group = MentionGroups.findOne(groupId);
		if (group == null) {
			throw new Meteor.Error('error-not-found', 'Group not found', { method: 'deleteMentionGroup' });
		}
		MentionGroups.remove({ _id: groupId });
		return true;
	},
});
