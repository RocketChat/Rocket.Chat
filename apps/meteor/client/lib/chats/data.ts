import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';

import { Messages, Rooms, Subscriptions } from '../../../app/models/client';
import { call } from '../utils/call';
import { DataAPI } from './ChatAPI';

export const createDataAPI = ({ rid }: { rid: IRoom['_id'] }): DataAPI => {
	const findMessageByID = async (mid: IMessage['_id']): Promise<IMessage | undefined> =>
		(Messages as Mongo.Collection<IMessage>).findOne({ _id: mid }, { reactive: false }) ?? call('getSingleMessage', mid);

	const getMessageByID = async (mid: IMessage['_id']): Promise<IMessage> => {
		const message = await findMessageByID(mid);

		if (!message) {
			throw new Error('Message not found');
		}

		return message;
	};

	const findRoom = async (): Promise<IRoom | undefined> => (Rooms as Mongo.Collection<IRoom>).findOne({ _id: rid }, { reactive: false });

	const getRoom = async (): Promise<IRoom> => {
		const room = await findRoom();

		if (!room) {
			throw new Error('Room not found');
		}

		return room;
	};

	const findDiscussionByID = async (drid: IRoom['_id']): Promise<IRoom | undefined> =>
		(Rooms as Mongo.Collection<IRoom>).findOne({ _id: drid, prid: { $exists: true } }, { reactive: false });

	const getDiscussionByID = async (drid: IRoom['_id']): Promise<IRoom> => {
		const discussion = await findDiscussionByID(drid);

		if (!discussion) {
			throw new Error('Discussion not found');
		}

		return discussion;
	};

	const findSubscriptionByRoomID = async (rid: IRoom['_id']): Promise<ISubscription | undefined> =>
		(Subscriptions as Mongo.Collection<ISubscription>).findOne({ rid }, { reactive: false });

	const getSubscriptionByRoomID = async (rid: IRoom['_id']): Promise<ISubscription> => {
		const subscription = await findSubscriptionByRoomID(rid);

		if (!subscription) {
			throw new Error('Subscription not found');
		}

		return subscription;
	};

	const deleteMessage = async (mid: IMessage['_id']): Promise<void> => {
		await call('deleteMessage', { _id: mid });
	};

	return {
		findMessageByID,
		getMessageByID,
		findRoom,
		getRoom,
		findDiscussionByID,
		getDiscussionByID,
		findSubscriptionByRoomID,
		getSubscriptionByRoomID,
		deleteMessage,
	};
};
