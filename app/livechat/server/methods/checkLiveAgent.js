import { Meteor } from 'meteor/meteor';
import { Users } from '../../../models';

Meteor.methods({
	'livechat:checkLiveAgent'(agentId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:checkLiveAgent' });
		}

		const user = Users.findOne({ _id: agentId });
		return {
			userStatus: user.status,
		};
	},
});
