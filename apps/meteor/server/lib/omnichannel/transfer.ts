import { randomUUID } from 'node:crypto';

import { Message } from '@rocket.chat/core-services';
import type { ILivechatDepartment, ILivechatVisitor, IOmnichannelRoom, TransferData } from '@rocket.chat/core-typings';
import { Users, LivechatRooms, LivechatVisitors, LivechatDepartment } from '@rocket.chat/models';

import { normalizeTransferredByData } from './Helper';
import { RoutingManager } from './RoutingManager';
import { livechatLogger } from './logger';

// Allow another agent-leave event to retry if a worker exits without releasing its claim.
const AUTO_FORWARD_LOCK_MS = 5 * 60 * 1000;

export async function saveTransferHistory(room: IOmnichannelRoom, transferData: TransferData) {
	const { departmentId: previousDepartment } = room;
	const { department: nextDepartment, transferredBy, transferredTo, scope, comment } = transferData;

	const { _id, username } = transferredBy;
	const scopeData = scope || (nextDepartment ? 'department' : 'agent');
	livechatLogger.info({ msg: 'Storing new chat transfer', roomId: room._id, transferredBy: _id, scope: scopeData });

	const transferMessage = {
		...(transferData.transferredBy.userType === 'visitor' && { token: room.v.token }),
		transferData: {
			transferredBy,
			ts: new Date(),
			scope: scopeData,
			comment,
			...(previousDepartment && { previousDepartment }),
			...(nextDepartment && { nextDepartment }),
			...(transferredTo && { transferredTo }),
		},
	};

	await Message.saveSystemMessageAndNotifyUser('livechat_transfer_history', room._id, '', { _id, username }, transferMessage);
}

export async function forwardOpenChats(userId: string) {
	livechatLogger.debug({ msg: 'Transferring open chats for user', userId });
	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Error('error-invalid-user');
	}

	const { _id, username, name } = user;
	for await (const candidate of LivechatRooms.findOpenByAgent(userId)) {
		if (!candidate.servedBy) {
			continue;
		}
		const now = new Date();
		const token = randomUUID();
		const room = await LivechatRooms.claimAutoForward(
			candidate._id,
			candidate.servedBy,
			{ token, expiresAt: new Date(now.getTime() + AUTO_FORWARD_LOCK_MS) },
			now,
		);
		if (!room) {
			continue;
		}

		try {
			const guest = await LivechatVisitors.findOneEnabledById(room.v._id);
			if (!guest) {
				continue;
			}

			const transferredBy = normalizeTransferredByData({ _id, username, name }, room);
			await transfer(room, guest, {
				transferredBy,
				departmentId: guest.department,
			});
		} finally {
			await LivechatRooms.releaseAutoForward(room._id, token);
		}
	}
}

export async function transfer(room: IOmnichannelRoom, guest: ILivechatVisitor, transferData: TransferData) {
	livechatLogger.debug({ msg: 'Transferring room', roomId: room._id, transferredBy: transferData?.transferredBy?._id });
	if (room.onHold) {
		throw new Error('error-room-onHold');
	}

	if (transferData.departmentId) {
		const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'name' | '_id'>>(transferData.departmentId, {
			projection: { name: 1 },
		});
		if (!department) {
			throw new Error('error-invalid-department');
		}

		transferData.department = department;
		livechatLogger.debug({ msg: 'Transferring room to department', roomId: room._id, departmentId: transferData.department?._id });
	}

	return RoutingManager.transferRoom(room, guest, transferData);
}
