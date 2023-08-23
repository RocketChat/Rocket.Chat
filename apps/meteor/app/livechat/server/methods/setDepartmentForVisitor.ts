import { LivechatVisitors, Messages, LivechatRooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { normalizeTransferredByData } from '../lib/Helper';
import { Livechat } from '../lib/Livechat';

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
		methodDeprecationLogger.method('livechat:setDepartmentForVisitor', '7.0.0');

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
