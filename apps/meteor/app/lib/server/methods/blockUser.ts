import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Subscriptions } from '@rocket.chat/models';

import { Rooms } from '../../../models/server';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomMemberActions } from '../../../../definition/IRoomTypeConfig';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		blockUser({ rid, blocked }: { rid: string; blocked: string }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async blockUser({ rid, blocked }) {
		check(rid, String);
		check(blocked, String);
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockUser' });
		}

		const room = Rooms.findOne({ _id: rid });

		if (!(await roomCoordinator.getRoomDirectives(room.t).allowMemberAction(room, RoomMemberActions.BLOCK, userId))) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
		const subscription2 = await Subscriptions.findOneByRoomIdAndUserId(rid, blocked);

		if (!subscription || !subscription2) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		await Subscriptions.setBlockedByRoomId(rid, blocked, userId);

		return true;
	},
});
