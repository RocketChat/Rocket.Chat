import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/Livechat';
import { Livechat as LivechatTyped } from '../lib/LivechatTyped';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:saveInfo'(
			guestData: {
				_id: string;
				name?: string;
				email?: string;
				phone?: string;
				livechatData?: Record<string, any>;
			},
			roomData: {
				_id: string;
				topic?: string;
				tags?: string[];
				livechatData?: Record<string, any>;
				priorityId?: string;
				slaId?: string;
			},
		): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:saveInfo'(guestData, roomData) {
		methodDeprecationLogger.method('livechat:saveInfo', '7.0.0', 'Use "livechat/room.saveInfo" endpoint instead.');
		const userId = Meteor.userId();

		if (!userId || !(await hasPermissionAsync(userId, 'view-l-room'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveInfo' });
		}

		check(
			guestData,
			Match.ObjectIncluding({
				_id: String,
				name: Match.Optional(String),
				email: Match.Optional(String),
				phone: Match.Optional(String),
				livechatData: Match.Optional(Object),
			}),
		);

		check(
			roomData,
			Match.ObjectIncluding({
				_id: String,
				topic: Match.Optional(String),
				tags: Match.Optional([String]),
				livechatData: Match.Optional(Object),
				priorityId: Match.Optional(String),
				slaId: Match.Optional(String),
			}),
		);

		const room = await LivechatRooms.findOneById(roomData._id);
		if (!room || !isOmnichannelRoom(room)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:saveInfo' });
		}

		if ((!room.servedBy || room.servedBy._id !== userId) && !(await hasPermissionAsync(userId, 'save-others-livechat-room-info'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:saveInfo' });
		}

		if (room.sms) {
			delete guestData.phone;
		}

		// Note: type is right, but `check` converts it to something else
		// Since the endpoint is going to be deprecated, we can live with this for a while
		await Promise.allSettled([LivechatTyped.saveGuest(guestData as any, userId), Livechat.saveRoomInfo(roomData)]);

		const user = await Users.findOne({ _id: userId }, { projection: { _id: 1, username: 1 } });

		setImmediate(async () => {
			void callbacks.run('livechat.saveInfo', await LivechatRooms.findOneById(roomData._id), {
				user,
				oldRoom: room,
			});
		});

		return true;
	},
});
