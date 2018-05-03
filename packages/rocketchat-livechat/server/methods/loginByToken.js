import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:loginByToken'(token) {
		const user = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (!user) {
			return;
		}

		return {
			_id: user._id
		};
	}
});
