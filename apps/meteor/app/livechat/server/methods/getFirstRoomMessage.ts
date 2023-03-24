import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { LivechatRooms } from '@rocket.chat/models';

import { Messages } from '../../../models/server';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:getFirstRoomMessage'(params: { rid: string }): unknown;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:getFirstRoomMessage'({ rid }) {
		const uid = Meteor.userId();
		methodDeprecationLogger.warn('livechat:getFirstRoomMessage will be deprecated in future versions of Rocket.Chat');
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
