import { Meteor } from 'meteor/meteor';
import { Users } from '../../../models';

Meteor.methods({
	'livechat:changeLivechatStatus'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:changeLivechatStatus' });
		}

		const user = Meteor.user();

		const newStatus = user.statusLivechat === 'available' ? 'not-available' : 'available';

		return Users.setLivechatStatus(user._id, newStatus);
	},
});
