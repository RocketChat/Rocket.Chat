import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	sendMessageLivechat({ token, _id, rid, msg }, agent) {
		check(token, String);
		check(_id, String);
		check(rid, String);
		check(msg, String);

		const guest = LivechatVisitors.getVisitorByToken(token, {
			fields: {
				name: 1,
				username: 1,
				department: 1,
				token: 1
			}
		});

		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		return RocketChat.Livechat.sendMessage({
			guest,
			message: {
				_id,
				rid,
				msg,
				token
			},
			agent
		});
	}
});
