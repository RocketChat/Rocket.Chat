import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { RocketChat } from 'meteor/rocketchat:lib';
import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:closeByVisitor'({ roomId, token }) {
		const visitor = LivechatVisitors.getVisitorByToken(token);

		const language = (visitor && visitor.language) || RocketChat.settings.get('language') || 'en';

		return RocketChat.Livechat.closeRoom({
			visitor,
			room: RocketChat.models.Rooms.findOneOpenByRoomIdAndVisitorToken(roomId, token),
			comment: TAPi18n.__('Closed_by_visitor', { lng: language }),
		});
	},
});
