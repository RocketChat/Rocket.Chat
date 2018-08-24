import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:closeByVisitor'({ roomId, token }) {
		const room = RocketChat.models.Rooms.findOneOpenByVisitorToken(token, roomId);

		if (!room || !room.open) {
			return false;
		}

		const visitor = LivechatVisitors.getVisitorByToken(token);

		const language = (visitor && visitor.language) || RocketChat.settings.get('language') || 'en';

		return RocketChat.Livechat.closeRoom({
			visitor,
			room,
			comment: TAPi18n.__('Closed_by_visitor', { lng: language })
		});
	}
});
