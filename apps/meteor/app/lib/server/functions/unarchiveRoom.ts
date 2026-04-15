import { Message } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { notifyOnRoomChangedById, notifyOnSubscriptionChangedByRoomId } from '../lib/notifyListener';

const BATCH_SIZE = 100_000;

async function getActiveUserIds(userIds: string[]): Promise<Set<string>> {
	const activeUserIds = new Set<string>();

	for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
		const batch = await Users.findActiveByIds(userIds.slice(i, i + BATCH_SIZE), { projection: { _id: 1 } }).toArray();
		for (const u of batch) {
			activeUserIds.add(u._id);
		}
	}

	return activeUserIds;
}

async function unarchiveSubscriptionsByIds(ids: string[]): Promise<void> {
	for (let i = 0; i < ids.length; i += BATCH_SIZE) {
		await Subscriptions.unarchiveByIds(ids.slice(i, i + BATCH_SIZE));
	}
}

export const unarchiveRoom = async function (rid: string, user: IMessage['u']): Promise<void> {
	await Rooms.unarchiveById(rid);

	const archivedSubs = await Subscriptions.findArchivedByRoomId(rid, { projection: { 'u._id': 1 } }).toArray();

	if (archivedSubs.length > 0) {
		const activeUserIds = await getActiveUserIds(archivedSubs.map((s) => s.u._id));
		const idsToUnarchive = archivedSubs.filter((s) => activeUserIds.has(s.u._id)).map((s) => s._id);

		await unarchiveSubscriptionsByIds(idsToUnarchive);
		void notifyOnSubscriptionChangedByRoomId(rid);
	}

	await Message.saveSystemMessage('room-unarchived', rid, '', user);

	void notifyOnRoomChangedById(rid);
};
