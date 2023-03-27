import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { LivechatVisitors, LivechatRooms, Subscriptions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import type { IUser } from '@rocket.chat/core-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Users } from '../../../models/server';
import { Livechat } from '../lib/Livechat';
import { normalizeTransferredByData } from '../lib/Helper';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:transfer'(transferData: {
			roomId: string;
			userId?: string;
			departmentId?: string;
			comment?: string;
			clientAction?: boolean;
		}): boolean;
	}
}

// Deprecated in favor of "livechat/room.forward" endpoint
// TODO: Deprecated: Remove in v6.0.0
Meteor.methods<ServerMethods>({
	async 'livechat:transfer'(transferData) {
		methodDeprecationLogger.warn('livechat:transfer method is deprecated in favor of "livechat/room.forward" endpoint');
		const uid = Meteor.userId();
		if (!uid || !(await hasPermissionAsync(uid, 'view-l-room'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:transfer' });
		}

		check(transferData, {
			roomId: String,
			userId: Match.Optional(String),
			departmentId: Match.Optional(String),
			comment: Match.Optional(String),
			clientAction: Match.Optional(Boolean),
		});

		const room = await LivechatRooms.findOneById(transferData.roomId);
		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:transfer' });
		}

		if (!room.open) {
			throw new Meteor.Error('room-closed', 'Room closed', { method: 'livechat:transfer' });
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, uid, {
			projection: { _id: 1 },
		});
		if (!subscription && !(await hasPermissionAsync(uid, 'transfer-livechat-guest'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:transfer',
			});
		}

		const guest = await LivechatVisitors.findOneById(room.v?._id);

		const normalizedTransferData: {
			roomId: string;
			userId?: string;
			departmentId?: string;
			comment?: string;
			clientAction?: boolean;
			transferredBy: ReturnType<typeof normalizeTransferredByData>;
			transferredTo?: Pick<IUser, '_id' | 'username' | 'name'>;
		} = {
			...transferData,
			transferredBy: normalizeTransferredByData(Meteor.user() || {}, room),
		};

		if (normalizedTransferData.userId) {
			const userToTransfer = Users.findOneById(normalizedTransferData.userId);
			normalizedTransferData.transferredTo = {
				_id: userToTransfer._id,
				username: userToTransfer.username,
				name: userToTransfer.name,
			};
		}

		return Livechat.transfer(room, guest, normalizedTransferData);
	},
});
