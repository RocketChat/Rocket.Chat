import { Messages, Roles, Rooms, Subscriptions, ReadReceipts } from '@rocket.chat/models';

import { FileUpload } from '../../../file-upload/server';
import { notifyOnSubscriptionChangedByRoomId } from '../lib/notifyListener';
import type { SubscribedRoomsForUserWithDetails } from './getRoomsWithSingleOwner';

const bulkRoomCleanUp = async (rids: string[]): Promise<void> => {
	const responses = await Promise.all([
		Subscriptions.removeByRoomIds(rids),
		Messages.removeByRoomIds(rids),
		ReadReceipts.removeByRoomIds(rids),
		Rooms.removeByIds(rids),
		// no bulk deletion for files
		...rids.map((rid) => FileUpload.removeFilesByRoomId(rid)),
	]);

	if (responses[0].deletedCount) {
		for await (const rid of rids) {
			await notifyOnSubscriptionChangedByRoomId(rid);
		}
	}
};

export const relinquishRoomOwnerships = async function (
	userId: string,
	subscribedRooms: SubscribedRoomsForUserWithDetails[],
	removeDirectMessages = true,
): Promise<SubscribedRoomsForUserWithDetails[]> {
	// change owners
	const changeOwner = subscribedRooms.filter(({ shouldChangeOwner }) => shouldChangeOwner);

	for await (const { newOwner, rid } of changeOwner) {
		newOwner && (await Roles.addUserRoles(newOwner, ['owner'], rid));
	}

	const roomIdsToRemove: string[] = subscribedRooms.filter(({ shouldBeRemoved }) => shouldBeRemoved).map(({ rid }) => rid);

	if (removeDirectMessages) {
		(await Rooms.find1On1ByUserId(userId, { projection: { _id: 1 } }).toArray()).map(({ _id }: { _id: string }) =>
			roomIdsToRemove.push(_id),
		);
	}

	await bulkRoomCleanUp(roomIdsToRemove);

	return subscribedRooms;
};
