import type { IRoom, ISubscription, ISubscriptionLabel, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../logger/system';
import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../notifyListener';
import { readMessages } from '../readMessages';

export const setSubscriptionLabels = async (uid: IUser['_id'], rid: IRoom['_id'], labelIds: ISubscriptionLabel['_id'][]): Promise<void> => {
	const subscription = await Subscriptions.findOneByRoomIdAndUserId<Pick<ISubscription, '_id' | 't'>>(rid, uid, { projection: { t: 1 } });
	if (!subscription) {
		throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription');
	}
	if (subscription.t === 'l') {
		throw new Meteor.Error('error-invalid-room-type', 'Omnichannel rooms cannot be labelled');
	}

	if (labelIds.length) {
		const user = await Users.findOneById<Pick<IUser, '_id' | 'settings'>>(uid, {
			projection: { 'settings.preferences.subscriptionLabels': 1 },
		});
		const userLabels: ISubscriptionLabel[] = user?.settings?.preferences?.subscriptionLabels ?? [];
		if (!labelIds.every((labelId) => userLabels.some(({ _id }) => _id === labelId))) {
			throw new Meteor.Error('error-label-not-found', 'Label not found');
		}
	}

	const { modifiedCount } = await Subscriptions.setLabelsByRoomIdAndUserId(rid, uid, labelIds);
	if (modifiedCount) {
		void notifyOnSubscriptionChangedByRoomIdAndUserId(rid, uid);
	}
};

/** Marks the user's unread rooms among `roomIds` as read; a room that fails is logged and skipped. */
export const readSubscriptions = async (uid: IUser['_id'], roomIds: IRoom['_id'][]): Promise<void> => {
	const subscriptions = await Subscriptions.findByUserIdAndRoomIds<Pick<ISubscription, '_id' | 'rid' | 'alert' | 'unread' | 'tunread'>>(
		uid,
		roomIds,
		{ projection: { rid: 1, alert: 1, unread: 1, tunread: 1 } },
	).toArray();

	const unreadRoomIds = subscriptions.filter(({ alert, unread, tunread }) => alert || unread > 0 || tunread?.length).map(({ rid }) => rid);
	if (!unreadRoomIds.length) {
		return;
	}

	const rooms = await Rooms.findByIds(unreadRoomIds).toArray();

	for (const room of rooms) {
		try {
			await readMessages(room, uid, true);
		} catch (error) {
			SystemLogger.error({ msg: 'Failed to mark room as read', rid: room._id, err: error });
		}
	}
};
