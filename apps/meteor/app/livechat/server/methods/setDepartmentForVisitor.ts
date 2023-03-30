import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { LivechatVisitors, Messages, LivechatRooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Livechat } from '../lib/Livechat';
import { normalizeTransferredByData } from '../lib/Helper';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:setDepartmentForVisitor'({
			roomId,
			visitorToken,
			departmentId,
		}: {
			roomId: string;
			visitorToken: string;
			departmentId: string;
		}): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:setDepartmentForVisitor'({ roomId, visitorToken, departmentId }) {
		methodDeprecationLogger.warn('livechat:setDepartmentForVisitor will be deprecated in future versions of Rocket.Chat');

		check(roomId, String);
		check(visitorToken, String);
		check(departmentId, String);

		const room = await LivechatRooms.findOneById(roomId);
		const visitor = await LivechatVisitors.getVisitorByToken(visitorToken);

		if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor?.token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		// update visited page history to not expire
		await Messages.keepHistoryForToken(visitorToken);

		const transferData = {
			roomId,
			departmentId,
			transferredBy: normalizeTransferredByData(visitor, room),
		};

		return Livechat.transfer(room, visitor, transferData);
	},
});
