import { Rooms } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomAsync } from '../../../authorization/server';
import notifications from '../../../notifications/server/lib/Notifications';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		updateOTRAck({ message, ack }: { message: any; ack: any }): void;
	}
}

Meteor.methods<ServerMethods>({
	async updateOTRAck({ message, ack }) {
		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateOTRAck' });
		}

		check(ack, String);
		check(message, {
			_id: String,
			rid: String,
			msg: String,
			t: Match.Any,
			ts: Date,
			u: {
				_id: String,
				username: String,
				name: String,
			},
			_updatedAt: Date,
			urls: Match.Any,
			mentions: Match.Any,
			channels: Match.Optional([
				{
					_id: String,
					name: String,
				},
			]),
			otr: Match.Maybe({ ack: String }),
		});

		if (message?.t !== 'otr') {
			throw new Meteor.Error('error-invalid-message', 'Invalid message type', { method: 'updateOTRAck' });
		}

		const room = await Rooms.findOneById(message.rid, { projection: { t: 1, _id: 1, uids: 1 } });

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'updateOTRAck' });
		}

		if (!(await canAccessRoomAsync(room, { _id: uid })) || (room.uids && (!message.u._id || !room.uids.includes(message.u._id)))) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user, not in room', { method: 'updateOTRAck' });
		}

		const otrStreamer = notifications.streamRoomMessage;
		otrStreamer.emit(message.rid, { ...message, otr: { ack } });
	},
});
