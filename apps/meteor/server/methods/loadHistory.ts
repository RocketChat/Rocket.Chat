import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Subscriptions, Rooms } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync, roomAccessAttributes } from '../../app/authorization/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { loadMessageHistory } from '../../app/lib/server/functions/loadMessageHistory';
import { settings } from '../../app/settings/server';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		loadHistory(
			rid: IRoom['_id'],
			ts?: Date,
			limit?: number,
			ls?: string | Date,
			showThreadMessages?: boolean,
		):
			| {
					messages: IMessage[];
					firstUnread: IMessage | undefined;
					unreadNotLoaded: number;
			  }
			| false;
	}
}

Meteor.methods<ServerMethods>({
	async loadHistory(rid, end, limit = 20, ls, showThreadMessages = true) {
		check(rid, String);
		const fromUser = await Meteor.userAsync();

		if (!fromUser && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadHistory',
			});
		}

		const room = await Rooms.findOneById(rid, { projection: { ...roomAccessAttributes, t: 1 } });
		if (!room) {
			return false;
		}

		// this checks the Allow Anonymous Read setting, so no need to check again
		if (!(await canAccessRoomAsync(room, fromUser || undefined))) {
			return false;
		}

		// if fromId is undefined and it passed the previous check, the user is reading anonymously
		if (!fromUser) {
			return loadMessageHistory({ rid, end, limit, ls, showThreadMessages });
		}

		const canPreview = await hasPermissionAsync(fromUser._id, 'preview-c-room');

		if (room.t === 'c' && !canPreview && !(await Subscriptions.findOneByRoomIdAndUserId(rid, fromUser._id, { projection: { _id: 1 } }))) {
			return false;
		}

		return loadMessageHistory({ userId: fromUser._id, rid, end, limit, ls, showThreadMessages });
	},
});
