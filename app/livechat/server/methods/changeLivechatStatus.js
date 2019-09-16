import { Meteor } from 'meteor/meteor';

import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:changeLivechatStatus'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:changeLivechatStatus' });
		}

		const user = Meteor.user();

		const newStatus = user.statusLivechat === 'available' ? 'not-available' : 'available';
		if (!Livechat.allowAgentChangeServiceStatus(newStatus)) {
			throw new Meteor.Error('error-office-hours-are-closed', 'Not allowed', { method: 'livechat:changeLivechatStatus' });
		}

		return Livechat.setUserStatusLivechat(user._id, newStatus);
	},
});
