import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';

import { Subscriptions, Rooms } from '../../app/models/server';
import { canAccessRoomAsync, roomAccessAttributes } from '../../app/authorization/server';
import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { settings } from '../../app/settings/server';
import { loadMessageHistory } from '../../app/lib/server';

declare module '@rocket.chat/ui-contexts' {
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
					firstUnread: IMessage;
					unreadNotLoaded: number;
			  }
			| false;
	}
}

Meteor.methods<ServerMethods>({
	async loadHistory(rid, end, limit = 20, ls, showThreadMessages = true) {
		check(rid, String);

		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadHistory',
			});
		}

		const fromId = Meteor.userId();

		const room = Rooms.findOneById(rid, { fields: { ...roomAccessAttributes, t: 1 } });
		if (!room) {
			return false;
		}

		if (!fromId || !(await canAccessRoomAsync(room, { _id: fromId }))) {
			return false;
		}

		const canAnonymous = settings.get('Accounts_AllowAnonymousRead');
		const canPreview = await hasPermissionAsync(fromId, 'preview-c-room');

		if (room.t === 'c' && !canAnonymous && !canPreview && !Subscriptions.findOneByRoomIdAndUserId(rid, fromId, { fields: { _id: 1 } })) {
			return false;
		}

		return loadMessageHistory({ userId: fromId, rid, end, limit, ls, showThreadMessages });
	},
});
