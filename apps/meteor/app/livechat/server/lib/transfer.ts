import { Message } from '@rocket.chat/core-services';
import type { IOmnichannelRoom, TransferData } from '@rocket.chat/core-typings';

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
