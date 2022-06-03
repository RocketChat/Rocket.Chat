import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { settings } from '../../../settings';
import { LivechatRooms } from '../../../models';
import { LivechatVisitors } from '../../../models/server/raw';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	async 'livechat:closeByVisitor'({ roomId, token }) {
		const visitor = await LivechatVisitors.getVisitorByToken(token);

		const language = (visitor && visitor.language) || settings.get('Language') || 'en';

		return Livechat.closeRoom({
			visitor,
			room: LivechatRooms.findOneOpenByRoomIdAndVisitorToken(roomId, token),
			comment: TAPi18n.__('Closed_by_visitor', { lng: language }),
		});
	},
});
