import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization';
import { Users, MentionGroups } from '../../../../models';

Meteor.methods({
	addMentionGroup(group) {
		if (!hasPermission(this.userId, 'manage-mention-groups')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'addMentionGroup' });
		}
		group.name = group.name.trim();
		group._createdAt = new Date();
		group._createdBy = Users.findOne(this.userId, { fields: { username: 1 } });
		group._id = MentionGroups.insert(group);
		return group;
	},
});
