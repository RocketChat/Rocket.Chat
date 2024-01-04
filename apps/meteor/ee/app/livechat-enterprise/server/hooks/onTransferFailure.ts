import { Message } from '@rocket.chat/core-services';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IRoom, ILivechatVisitor, ILivechatDepartment, TransferData } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';

import { forwardRoomToDepartment } from '../../../../../app/livechat/server/lib/Helper';
import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

const onTransferFailure = async (
	room: IRoom,
	{
		guest,
		transferData,
	}: {
		guest: ILivechatVisitor;
		transferData: TransferData;
	},
) => {
	if (!isOmnichannelRoom(room)) {
		return false;
	}

	const { departmentId } = transferData;
	if (!departmentId) {
		return false;
	}

	const department = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'name' | '_id' | 'fallbackForwardDepartment'>>(
		departmentId,
		{
			projection: { _id: 1, name: 1, fallbackForwardDepartment: 1 },
		},
	);

	if (!department?.fallbackForwardDepartment?.length) {
		return false;
	}

	// TODO: find enabled not archived here
	const fallbackDepartment = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, '_id' | 'name'>>(
		department.fallbackForwardDepartment,
		{
			projection: { name: 1, _id: 1 },
		},
	);

	if (!fallbackDepartment) {
		return false;
	}

	const transferDataFallback = {
		...transferData,
		prevDepartment: department.name,
		departmentId: department.fallbackForwardDepartment,
		department: fallbackDepartment,
	};

	const forwardSuccess = await forwardRoomToDepartment(room, guest, transferDataFallback);
	if (forwardSuccess) {
		const { _id, username } = transferData.transferredBy;
		await Message.saveSystemMessage(
			'livechat_transfer_history_fallback',
			room._id,
			'',
			{ _id, username },
			{ transferData: transferDataFallback },
		);
	}

	cbLogger.info(`Fallback department ${department.fallbackForwardDepartment} found for department ${department._id}. Chat transfered`);
	return forwardSuccess;
};

callbacks.add('livechat:onTransferFailure', onTransferFailure, callbacks.priority.HIGH);
