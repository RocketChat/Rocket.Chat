import { callbacks } from '../../../../../app/callbacks/server';
import { forwardRoomToDepartment } from '../../../../../app/livechat/server/lib/Helper';
import { IRoom } from '../../../../../definition/IRoom';
import { ILivechatVisitor } from '../../../../../definition/ILivechatVisitor';
import { LivechatDepartment } from '../../../../../app/models/server/raw';
import { cbLogger } from '../lib/logger';

callbacks.add('livechat:onTransferFailure', async ({ room, guest, transferData }: { room: IRoom; guest: ILivechatVisitor; transferData: { [k: string]: string|any } }) => {
	cbLogger.debug(`Attempting to transfer room ${ room._id } using fallback departments`);
	const { departmentId } = transferData;
	const department = await LivechatDepartment.findOneById(departmentId);

	if (!department?.fallbackForwardDepartment) {
		return false;
	}

	cbLogger.debug(`Fallback department ${ department.fallbackForwardDepartment } found for department ${ department._id }. Redirecting`);
	const transferDataFallback = {
		...transferData,
		departmentId: department.fallbackForwardDepartment,
		department: await LivechatDepartment.findOneById(department.fallbackForwardDepartment, { fields: { name: 1, _id: 1 } }),
	};
	return forwardRoomToDepartment(room, guest, transferDataFallback);
}, callbacks.priority.HIGH);
