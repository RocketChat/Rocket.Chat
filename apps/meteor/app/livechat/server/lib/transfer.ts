import { Message } from '@rocket.chat/core-services';
import type { ILivechatDepartment, ILivechatVisitor, IOmnichannelRoom, TransferData } from '@rocket.chat/core-typings';
import { Users, LivechatRooms, LivechatVisitors, LivechatDepartment } from '@rocket.chat/models';

import { normalizeTransferredByData } from './Helper';
import { RoutingManager } from './RoutingManager';
import { livechatLogger } from './logger';

export async function saveTransferHistory(room: IOmnichannelRoom, transferData: TransferData) {
	const { departmentId: previousDepartment } = room;
	const { department: nextDepartment, transferredBy, transferredTo, scope, comment } = transferData;

	check(
		transferredBy,
		Match.ObjectIncluding({
			_id: String,
			username: String,
			name: Match.Maybe(String),
			userType: String,
		}),
	);

	const { _id, username } = transferredBy;
	const scopeData = scope || (nextDepartment ? 'department' : 'agent');
	livechatLogger.info(`Storing new chat transfer of ${room._id} [Transfered by: ${_id} to ${scopeData}]`);

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
	livechatLogger.debug(`Transferring open chats for user ${userId}`);
	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Error('error-invalid-user');
	}

	const { _id, username, name } = user;
	for await (const room of LivechatRooms.findOpenByAgent(userId)) {
		const guest = await LivechatVisitors.findOneEnabledById(room.v._id);
		if (!guest) {
			continue;
		}

		const transferredBy = normalizeTransferredByData({ _id, username, name }, room);
		await transfer(room, guest, {
			transferredBy,
			departmentId: guest.department,
		});
	}
}

export async function transfer(room: IOmnichannelRoom, guest: ILivechatVisitor, transferData: TransferData) {
	livechatLogger.debug(`Transfering room ${room._id} [Transfered by: ${transferData?.transferredBy?._id}]`);
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
		livechatLogger.debug(`Transfering room ${room._id} to department ${transferData.department?._id}`);
	}

	return RoutingManager.transferRoom(room, guest, transferData);
}
