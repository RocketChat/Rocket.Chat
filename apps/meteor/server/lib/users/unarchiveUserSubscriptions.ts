import { Rooms, Subscriptions } from '@rocket.chat/models';

const BATCH_SIZE = 100_000;

async function getArchivedRoomIds(rids: string[]): Promise<Set<string>> {
	const archivedRoomIds = new Set<string>();

	for (let i = 0; i < rids.length; i += BATCH_SIZE) {
		const batch = await Rooms.findManyArchivedByRoomIds(rids.slice(i, i + BATCH_SIZE), { projection: { _id: 1 } }).toArray();
		for (const r of batch) {
			archivedRoomIds.add(r._id);
		}
	}

	return archivedRoomIds;
}

async function unarchiveSubscriptionsByIds(ids: string[]): Promise<void> {
	for (let i = 0; i < ids.length; i += BATCH_SIZE) {
		await Subscriptions.unarchiveByIds(ids.slice(i, i + BATCH_SIZE));
	}
}

export const unarchiveUserSubscriptions = async (userId: string): Promise<boolean> => {
	const archivedSubs = await Subscriptions.findArchivedByUserId(userId, { projection: { rid: 1 } }).toArray();

	if (!archivedSubs.length) {
		return false;
	}

	const archivedRoomIds = await getArchivedRoomIds(archivedSubs.map((s) => s.rid));
	const idsToUnarchive = archivedSubs.filter((s) => !archivedRoomIds.has(s.rid)).map((s) => s._id);

	if (!idsToUnarchive.length) {
		return false;
	}

	await unarchiveSubscriptionsByIds(idsToUnarchive);
	return true;
};
