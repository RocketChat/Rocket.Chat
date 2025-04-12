import { Omnichannel } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { LivechatVisitors, LivechatRooms, Subscriptions, Users } from '@rocket.chat/models';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { normalizeTransferredByData } from '../lib/Helper';
import { transfer } from '../lib/transfer';

declare module '@rocket.chat/ddp-client' {
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
		methodDeprecationLogger.method('livechat:transfer', '7.0.0');
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

		if (!(await Omnichannel.isWithinMACLimit(room))) {
			throw new Meteor.Error('error-mac-limit-reached', 'MAC limit reached', { method: 'livechat:transfer' });
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, uid, {
			projection: { _id: 1 },
		});
		if (!subscription && !(await hasPermissionAsync(uid, 'transfer-livechat-guest'))) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', {
				method: 'livechat:transfer',
			});
		}

		const guest = await LivechatVisitors.findOneEnabledById(room.v?._id);

		if (!guest) {
			throw new Meteor.Error('error-invalid-visitor', 'Invalid visitor', { method: 'livechat:transfer' });
		}

		const user = await Meteor.userAsync();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'livechat:transfer' });
		}

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
			transferredBy: normalizeTransferredByData(user, room),
		};

		if (normalizedTransferData.userId) {
			const userToTransfer = await Users.findOneById(normalizedTransferData.userId);
			if (!userToTransfer) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user to transfer the room');
			}
			normalizedTransferData.transferredTo = {
				_id: userToTransfer._id,
				username: userToTransfer.username,
				name: userToTransfer.name,
			};
		}

		return transfer(room, guest, normalizedTransferData);
	},
});
