import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:loginByToken'(token) {
		const visitor = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (!user) {
			return;
		}

		let roomId;
		if (visitor) {
			const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

			if (rooms && rooms.length > 0) {
				roomId = rooms[0]._id;
			}
		}		
		
		return {
			_id: user._id,
			roomId
		};
	}
});
