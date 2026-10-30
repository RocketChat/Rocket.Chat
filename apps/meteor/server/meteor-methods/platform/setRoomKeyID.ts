import { ClientSafeError } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions } from '@rocket.chat/models';

import { client } from '../../database/utils';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
import { notifyOnRoomChanged, notifyOnSubscriptionChanged } from '../../lib/notifyListener';

// When supplied, the caller's encrypted key and the room key ID are committed together.
export const setRoomKeyIDMethod = async (userId: string, rid: IRoom['_id'], keyID: string, key?: string): Promise<void> => {
	if (!(await canAccessRoomIdAsync(rid, userId))) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'e2e.setRoomKeyID' });
	}

	if (!key) {
		const room = await Rooms.setE2eKeyId(rid, keyID);

		if (!room) {
			throw new ClientSafeError('error-room-e2e-key-already-exists', 'E2E Key ID already exists', {
				method: 'e2e.setRoomKeyID',
			});
		}

		void notifyOnRoomChanged(room);
		return;
	}

	const session = client.startSession();
	let callbackFailure: { error: unknown } | undefined;
	let subscriptionChange;
	try {
		subscriptionChange = await session.withTransaction(
			async () => {
				callbackFailure = undefined;
				try {
					const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId, { session });
					if (!subscription) {
						throw new ClientSafeError('error-invalid-subscription', 'Invalid subscription', { method: 'e2e.setRoomKeyID' });
					}

					const room = await Rooms.setE2eKeyId(rid, keyID, { session });
					if (!room) {
						throw new ClientSafeError('error-room-e2e-key-already-exists', 'E2E Key ID already exists', {
							method: 'e2e.setRoomKeyID',
						});
					}

					const { matchedCount, modifiedCount } = await Subscriptions.setGroupE2EKey(subscription._id, key, { session });
					if (!matchedCount) {
						throw new ClientSafeError('error-invalid-subscription', 'Invalid subscription', { method: 'e2e.setRoomKeyID' });
					}
					await Rooms.removeUsersFromE2EEQueueByRoomId(rid, [userId], { session });

					return { id: subscription._id, modifiedCount };
				} catch (error) {
					callbackFailure = { error };
					throw error;
				}
			},
			{ readPreference: 'primary' },
		);
	} catch (error) {
		throw callbackFailure ? callbackFailure.error : error;
	} finally {
		await session.endSession().catch(() => undefined);
	}

	if (subscriptionChange.modifiedCount) {
		const subscription = await Subscriptions.findOneById(subscriptionChange.id, { readPreference: 'primary' });
		if (subscription) {
			void notifyOnSubscriptionChanged(subscription);
		}
	}
	const room = await Rooms.findOneById(rid, { readPreference: 'primary' });
	if (room) {
		void notifyOnRoomChanged(room);
	}
};
