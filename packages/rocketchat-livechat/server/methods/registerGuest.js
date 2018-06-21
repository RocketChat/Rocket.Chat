import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:registerGuest'({ token, name, email, department } = {}) {
		const userId = RocketChat.Livechat.registerGuest.call(this, {
			token,
			name,
			email,
			department
		});

		// update visited page history to not expire
		RocketChat.models.Messages.keepHistoryForToken(token);

		const visitor = LivechatVisitors.getVisitorByToken(token, {
			fields: {
				token: 1,
				name: 1,
				username: 1,
				visitorEmails: 1
			}
		});

		return {
			userId,
			visitor
		};
	}
});
