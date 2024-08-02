import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatRooms, Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getFirstRoomMessage'(params: { rid: string }): unknown;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getFirstRoomMessage'({ rid }) {
		const uid = Meteor.userId();
		methodDeprecationLogger.method('livechat:getFirsRoomMessage', '7.0.0');
		if (!uid || !(await hasPermissionAsync(uid, 'view-l-room'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getFirstRoomMessage',
			});
		}

		check(rid, String);

		const room = await LivechatRooms.findOneById(rid);

		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		return Messages.findOne({ rid }, { sort: { ts: 1 } });
	},
});
