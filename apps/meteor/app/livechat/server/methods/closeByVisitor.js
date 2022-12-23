import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { LivechatVisitors } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { LivechatRooms } from '../../../models/server';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:closeByVisitor'({ roomId, token }) {
		methodDeprecationLogger.warn('livechat:closeByVisitor will be deprecated in future versions of Rocket.Chat');
		const visitor = await LivechatVisitors.getVisitorByToken(token);

		const language = (visitor && visitor.language) || settings.get('Language') || 'en';

		return Livechat.closeRoom({
			visitor,
			room: LivechatRooms.findOneOpenByRoomIdAndVisitorToken(roomId, token),
			comment: TAPi18n.__('Closed_by_visitor', { lng: language }),
		});
	},
});
