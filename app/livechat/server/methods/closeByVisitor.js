import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { settings } from '/app/settings';
import { Rooms, LivechatVisitors } from '/app/models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:closeByVisitor'({ roomId, token }) {
		const visitor = LivechatVisitors.getVisitorByToken(token);

		const language = (visitor && visitor.language) || settings.get('Language') || 'en';

		return Livechat.closeRoom({
			visitor,
			room: Rooms.findOneOpenByRoomIdAndVisitorToken(roomId, token),
			comment: TAPi18n.__('Closed_by_visitor', { lng: language }),
		});
	},
});
