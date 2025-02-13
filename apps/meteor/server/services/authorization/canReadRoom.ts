import { Authorization } from '@rocket.chat/core-services';
import { Subscriptions } from '@rocket.chat/models';

export const canReadRoom = async (uid: string, { roomType, rid }: { roomType: string; rid: string }) => {
	if (
		roomType === 'c' &&
		!(await Authorization.hasPermission(uid, 'preview-c-room')) &&
		!(await Subscriptions.findOneByRoomIdAndUserId(rid, uid, { projection: { _id: 1 } }))
	) {
		return false;
	}

	return true;
};
