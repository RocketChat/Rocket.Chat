import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';

import { Messages, Rooms, Subscriptions } from '../../../app/models/client';
import { call } from '../utils/call';
import { DataAPI } from './ChatAPI';

const messagesCollection = Messages as Mongo.Collection<IMessage>;
const roomsCollection = Rooms as Mongo.Collection<IRoom>;
const subscriptionsCollection = Subscriptions as Mongo.Collection<ISubscription>;

export const createDataAPI = ({ rid, tmid }: { rid: IRoom['_id']; tmid: IMessage['_id'] | undefined }): DataAPI => {
	const findMessageByID = async (mid: IMessage['_id']): Promise<IMessage | undefined> =>
		messagesCollection.findOne({ _id: mid, _hidden: { $ne: true } }, { reactive: false }) ?? call('getSingleMessage', mid);

	const getMessageByID = async (mid: IMessage['_id']): Promise<IMessage> => {
		const message = await findMessageByID(mid);

		if (!message) {
			throw new Error('Message not found');
		}

		return message;
	};

	const findLastMessage = async (): Promise<IMessage | undefined> =>
		messagesCollection.findOne({ rid, tmid: tmid ?? { $exists: false }, _hidden: { $ne: true } }, { sort: { ts: -1 }, reactive: false });

	const getLastMessage = async (): Promise<IMessage> => {
		const message = await findLastMessage();

		if (!message) {
			throw new Error('Message not found');
		}

		return message;
	};
	const pushEphemeralMessage = async (message: Omit<IMessage, 'rid' | 'tmid'>): Promise<void> => {
		messagesCollection.upsert({ _id: message._id }, { $set: { ...message, rid, ...(tmid && { tmid }) } });
	};

	const deleteMessage = async (mid: IMessage['_id']): Promise<void> => {
		await call('deleteMessage', { _id: mid });
	};

	const findRoom = async (): Promise<IRoom | undefined> => roomsCollection.findOne({ _id: rid }, { reactive: false });

	const getRoom = async (): Promise<IRoom> => {
		const room = await findRoom();

		if (!room) {
			throw new Error('Room not found');
		}

		return room;
	};

	const findDiscussionByID = async (drid: IRoom['_id']): Promise<IRoom | undefined> =>
		roomsCollection.findOne({ _id: drid, prid: { $exists: true } }, { reactive: false });

	const getDiscussionByID = async (drid: IRoom['_id']): Promise<IRoom> => {
		const discussion = await findDiscussionByID(drid);

		if (!discussion) {
			throw new Error('Discussion not found');
		}

		return discussion;
	};

	const findSubscriptionByRoomID = async (rid: IRoom['_id']): Promise<ISubscription | undefined> =>
		subscriptionsCollection.findOne({ rid }, { reactive: false });

	const getSubscriptionByRoomID = async (rid: IRoom['_id']): Promise<ISubscription> => {
		const subscription = await findSubscriptionByRoomID(rid);

		if (!subscription) {
			throw new Error('Subscription not found');
		}

		return subscription;
	};

	return {
		findMessageByID,
		getMessageByID,
		findLastMessage,
		getLastMessage,
		pushEphemeralMessage,
		deleteMessage,
		findRoom,
		getRoom,
		findDiscussionByID,
		getDiscussionByID,
		findSubscriptionByRoomID,
		getSubscriptionByRoomID,
	};
};
