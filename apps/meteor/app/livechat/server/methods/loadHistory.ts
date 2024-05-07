import type { IMessage } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatRooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { loadMessageHistory } from '../../../lib/server/functions/loadMessageHistory';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:loadHistory'(params: { token: string; rid: string; end?: Date; limit?: number; ls: Date }):
			| {
					messages: IMessage[];
					firstUnread: any;
					unreadNotLoaded: number;
			  }
			| undefined;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:loadHistory'({ token, rid, end, limit = 20, ls }) {
		methodDeprecationLogger.method('livechat:loadHistory', '7.0.0');

		if (!token || typeof token !== 'string') {
			return;
		}

		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (!visitor) {
			throw new Meteor.Error('invalid-visitor', 'Invalid Visitor', {
				method: 'livechat:loadHistory',
			});
		}

		const room = await LivechatRooms.findOneByIdAndVisitorToken(rid, token, { projection: { _id: 1 } });
		if (!room) {
			throw new Meteor.Error('invalid-room', 'Invalid Room', { method: 'livechat:loadHistory' });
		}

		return loadMessageHistory({ userId: visitor._id, rid, end, limit, ls });
	},
});
