import { FileUpload } from '../../../file-upload/server';
import { Subscriptions, Messages, Rooms } from '../../../models/server';
import { Roles } from '../../../models/server/raw';

const bulkRoomCleanUp = (rids: string[]): unknown => {
	// no bulk deletion for files
	rids.forEach((rid) => FileUpload.removeFilesByRoomId(rid));

	return Promise.await(Promise.all([Subscriptions.removeByRoomIds(rids), Messages.removeByRoomIds(rids), Rooms.removeByIds(rids)]));
};

export const relinquishRoomOwnerships = async function (
	userId: string,
	subscribedRooms: [],
	removeDirectMessages = true,
): Promise<unknown> {
	// change owners
	const changeOwner = subscribedRooms.filter(({ shouldChangeOwner }: { shouldChangeOwner: string[] }) => shouldChangeOwner);

	for await (const { newOwner, rid } of changeOwner) {
		await Roles.addUserRoles(newOwner, ['owner'], rid);
	}

	const roomIdsToRemove: string[] = subscribedRooms.filter(({ shouldBeRemoved }) => shouldBeRemoved).map(({ rid }) => rid);

	if (removeDirectMessages) {
		Rooms.find1On1ByUserId(userId, { fields: { _id: 1 } }).forEach(({ _id }: { _id: string }) => roomIdsToRemove.push(_id));
	}

	bulkRoomCleanUp(roomIdsToRemove);

	return subscribedRooms;
};
