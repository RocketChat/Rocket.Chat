import { FileUpload } from '../../../file-upload/server';
import { Subscriptions, Messages, Rooms } from '../../../models/server';
import { Roles } from '../../../models/server/raw';

const bulkRoomCleanUp = (rids) => {
	// no bulk deletion for files
	rids.forEach((rid) => FileUpload.removeFilesByRoomId(rid));

	return Promise.await(Promise.all([Subscriptions.removeByRoomIds(rids), Messages.removeByRoomIds(rids), Rooms.removeByIds(rids)]));
};

export const relinquishRoomOwnerships = async function (userId, subscribedRooms, removeDirectMessages = true) {
	// change owners
	const changeOwner = subscribedRooms.filter(({ shouldChangeOwner }) => shouldChangeOwner);

	for await (const { newOwner, rid } of changeOwner) {
		await Roles.addUserRoles(newOwner, ['owner'], rid);
	}

	const roomIdsToRemove = subscribedRooms.filter(({ shouldBeRemoved }) => shouldBeRemoved).map(({ rid }) => rid);

	if (removeDirectMessages) {
		Rooms.find1On1ByUserId(userId, { fields: { _id: 1 } }).forEach(({ _id }) => roomIdsToRemove.push(_id));
	}

	bulkRoomCleanUp(roomIdsToRemove);

	return subscribedRooms;
};
