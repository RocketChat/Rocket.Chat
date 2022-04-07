import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { LivechatVisitors } from '../../../models';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { OmnichannelSourceType } from '../../../../definition/IRoom';

Meteor.methods({
	'livechat:startFileUploadRoom'(roomId, token) {
		methodDeprecationLogger.warn('livechat:startFileUploadRoom will be deprecated in future versions of Rocket.Chat');
		const guest = LivechatVisitors.getVisitorByToken(token);

		const message = {
			_id: Random.id(),
			rid: roomId || Random.id(),
			msg: '',
			ts: new Date(),
			token: guest.token,
		};

		const roomInfo = {
			source: OmnichannelSourceType.API,
			alias: 'file-upload',
		};

		return Livechat.getRoom(guest, message, roomInfo);
	},
});
