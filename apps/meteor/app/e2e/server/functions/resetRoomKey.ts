import type { ISubscription, IUser, IRoom } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import type { AnyBulkWriteOperation } from 'mongodb';

import { notifyOnRoomChanged, notifyOnSubscriptionChanged } from '../../../lib/server/lib/notifyListener';

export async function resetRoomKey(roomId: string, userId: string, newRoomKey: string, newRoomKeyId: string) {
	const user = await Users.findOneById<Pick<IUser, 'e2e'>>(userId, { projection: { e2e: 1 } });
	if (!user) {
		throw new Error('error-user-not-found');
	}

	if (!user.e2e?.private_key || !user.e2e?.public_key) {
		throw new Error('error-user-has-no-keys');
	}

	const room = await Rooms.findOneById<Pick<IRoom, 'e2eKeyId'>>(roomId, { projection: { e2eKeyId: 1 } });
	if (!room) {
		throw new Error('error-room-not-found');
	}

	if (!room.e2eKeyId) {
		throw new Error('error-room-not-encrypted');
	}

	// We will update the subs of everyone who has a key for the room. For the ones that don't have, we will do nothing
	const notifySubs = [];
	const updateOps: AnyBulkWriteOperation<ISubscription>[] = [];
	const e2eQueue: IRoom['usersWaitingForE2EKeys'] = [];

	for await (const sub of Subscriptions.find({ rid: roomId })) {
		// This replicates the oldRoomKeys array modifications allowing us to have the changes locally without finding them again
		// which allows for quicker notifying
		const keys = replicateMongoSlice(room.e2eKeyId, sub);
		delete sub.E2ESuggestedKey;
		delete sub.E2EKey;

		// If you're requesting the reset but you don't have the key, that means you won't have a complete "oldRoomKeys"
		// So we'll put you on the list to get one
		if (sub.u._id === userId && !sub.E2EKey) {
			e2eQueue.push({ userId: sub.u._id, ts: new Date() });
		}

		const updateSet = {
			$set: {
				...(keys && { oldRoomKeys: keys }),
			},
		};
		updateOps.push({
			updateOne: {
				filter: { _id: sub._id },
				update: {
					$unset: { E2EKey: 1, E2ESuggestedKey: 1 },
					...(Object.keys(updateSet.$set).length && updateSet),
				},
			},
		});
		// Avoid notifying requesting user as notify will happen at the end
		userId !== sub.u._id &&
			notifySubs.push({
				...sub,
				...(keys && { oldRoomKeys: keys }),
			});

		// This is for allowing the key distribution process to start inmediately
		pushToLimit(e2eQueue, { userId: sub.u._id, ts: new Date() });

		if (updateOps.length >= 100) {
			await writeAndNotify(updateOps, notifySubs);
		}
	}

	if (updateOps.length > 0) {
		await writeAndNotify(updateOps, notifySubs);
	}

	// after the old keys have been moved to the new prop, store the room key for the user calling the func
	const roomResult = await Rooms.findOneAndUpdate({ _id: roomId }, { $set: { e2eKeyId: newRoomKeyId, ...(e2eQueue.length && { usersWaitingForE2EKeys: e2eQueue }) } });
	const result = await Subscriptions.setE2EKeyByUserIdAndRoomId(userId, roomId, newRoomKey);

	void notifyOnSubscriptionChanged(result.value!);
	void notifyOnRoomChanged(roomResult.value!);
}

function pushToLimit(arr: NonNullable<IRoom['usersWaitingForE2EKeys']>, item: NonNullable<IRoom['usersWaitingForE2EKeys']>[number], limit = 49) {
	if (arr.length < limit) {
		arr.push(item);
	}
}

async function writeAndNotify(updateOps: AnyBulkWriteOperation<ISubscription>[], notifySubs: ISubscription[]) {
	await Subscriptions.col.bulkWrite(updateOps);
	notifySubs.forEach((sub) => {
		void notifyOnSubscriptionChanged(sub);
	});
	notifySubs.length = 0;
	updateOps.length = 0;
}

function replicateMongoSlice(keyId: string, sub: ISubscription) {
	if (!sub.E2EKey) {
		return;
	}

	if (!sub.oldRoomKeys) {
		return [{ e2eKeyId: keyId, ts: new Date(), E2EKey: sub.E2EKey }];
	}

	const keys = sub.oldRoomKeys;
	keys.sort((a, b) => b.ts.getTime() - a.ts.getTime());
	keys.unshift({ e2eKeyId: keyId, ts: new Date(), E2EKey: sub.E2EKey });
	if (keys.length > 10) {
		return keys.slice(0, 10);
	}

	return keys;
}
