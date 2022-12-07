import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';
import moment from 'moment';

import { hasAtLeastOnePermission } from '../../../app/authorization/client';
import { Messages, Rooms, Subscriptions } from '../../../app/models/client';
import { settings } from '../../../app/settings/client';
import { readMessage, MessageTypes } from '../../../app/ui-utils/client';
import { getRandomId } from '../../../lib/random';
import { onClientBeforeSendMessage } from '../onClientBeforeSendMessage';
import { call } from '../utils/call';
import { prependReplies } from '../utils/prependReplies';
import type { DataAPI } from './ChatAPI';

const messagesCollection = Messages as Mongo.Collection<IMessage>;
const roomsCollection = Rooms as Mongo.Collection<IRoom>;
const subscriptionsCollection = Subscriptions as Mongo.Collection<ISubscription>;

export const createDataAPI = ({ rid, tmid }: { rid: IRoom['_id']; tmid: IMessage['_id'] | undefined }): DataAPI => {
	const composeMessage = async (
		text: string,
		{ sendToChannel, quotedMessages, originalMessage }: { sendToChannel?: boolean; quotedMessages: IMessage[]; originalMessage?: IMessage },
	): Promise<IMessage> => {
		const msg = await prependReplies(text, quotedMessages);

		const effectiveRID = originalMessage?.rid ?? rid;
		const effectiveTMID = originalMessage ? originalMessage.tmid : tmid;

		return (await onClientBeforeSendMessage({
			_id: originalMessage?._id ?? getRandomId(),
			rid: effectiveRID,
			...(effectiveTMID && {
				tmid: effectiveTMID,
				...(sendToChannel && { tshow: sendToChannel }),
			}),
			msg,
		})) as IMessage;
	};

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

	const findLastOwnMessage = async (): Promise<IMessage | undefined> => {
		const uid = Meteor.userId();

		if (!uid) {
			return undefined;
		}

		return messagesCollection.findOne(
			{ rid, 'tmid': tmid ?? { $exists: false }, 'u._id': uid, '_hidden': { $ne: true } },
			{ sort: { ts: -1 }, reactive: false },
		);
	};

	const getLastOwnMessage = async (): Promise<IMessage> => {
		const message = await findLastOwnMessage();

		if (!message) {
			throw new Error('Message not found');
		}

		return message;
	};

	const findPreviousOwnMessage = async (message: IMessage): Promise<IMessage | undefined> => {
		const uid = Meteor.userId();

		if (!uid) {
			return undefined;
		}

		return messagesCollection.findOne(
			{ rid, 'tmid': tmid ?? { $exists: false }, 'u._id': uid, '_hidden': { $ne: true }, 'ts': { $lt: message.ts } },
			{ sort: { ts: -1 }, reactive: false },
		);
	};

	const getPreviousOwnMessage = async (message: IMessage): Promise<IMessage> => {
		const previousMessage = await findPreviousOwnMessage(message);

		if (!previousMessage) {
			throw new Error('Message not found');
		}

		return previousMessage;
	};

	const findNextOwnMessage = async (message: IMessage): Promise<IMessage | undefined> => {
		const uid = Meteor.userId();

		if (!uid) {
			return undefined;
		}

		return messagesCollection.findOne(
			{ rid, 'tmid': tmid ?? { $exists: false }, 'u._id': uid, '_hidden': { $ne: true }, 'ts': { $gt: message.ts } },
			{ sort: { ts: 1 }, reactive: false },
		);
	};

	const getNextOwnMessage = async (message: IMessage): Promise<IMessage> => {
		const nextMessage = await findNextOwnMessage(message);

		if (!nextMessage) {
			throw new Error('Message not found');
		}

		return nextMessage;
	};

	const pushEphemeralMessage = async (message: Omit<IMessage, 'rid' | 'tmid'>): Promise<void> => {
		messagesCollection.upsert({ _id: message._id }, { $set: { ...message, rid, ...(tmid && { tmid }) } });
	};

	const canUpdateMessage = async (message: IMessage): Promise<boolean> => {
		if (MessageTypes.isSystemMessage(message)) {
			return false;
		}

		const hasPermission = hasAtLeastOnePermission('edit-message', message.rid);
		const editAllowed = (settings.get('Message_AllowEditing') as boolean | undefined) ?? false;
		const editOwn = message?.u && message.u._id === Meteor.userId();

		if (!hasPermission && (!editAllowed || !editOwn)) {
			return false;
		}

		const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes') as number | undefined;
		const elapsedMinutes = moment().diff(message.ts, 'minutes');
		if (elapsedMinutes && blockEditInMinutes && elapsedMinutes > blockEditInMinutes) {
			return false;
		}

		return true;
	};

	const updateMessage = async (message: Pick<IMessage, '_id' | 't'> & Partial<Omit<IMessage, '_id' | 't'>>): Promise<void> =>
		call('updateMessage', message);

	const canDeleteMessage = async (message: IMessage): Promise<boolean> => {
		if (MessageTypes.isSystemMessage(message)) {
			return false;
		}

		const hasPermission = hasAtLeastOnePermission('force-delete-message', message.rid);
		if (!hasPermission) {
			return false;
		}

		const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes') as number | undefined;
		const elapsedMinutes = moment().diff(message.ts, 'minutes');

		if (elapsedMinutes && blockDeleteInMinutes && elapsedMinutes > blockDeleteInMinutes) {
			return false;
		}

		return true;
	};

	const deleteMessage = async (mid: IMessage['_id']): Promise<void> => {
		await call('deleteMessage', { _id: mid });
	};

	const drafts = new Map<IMessage['_id'] | undefined, string>();

	const getDraft = async (mid: IMessage['_id'] | undefined): Promise<string | undefined> => drafts.get(mid);

	const discardDraft = async (mid: IMessage['_id'] | undefined): Promise<void> => {
		drafts.delete(mid);
	};

	const saveDraft = async (mid: IMessage['_id'] | undefined, draft: string): Promise<void> => {
		drafts.set(mid, draft);
	};

	const findRoom = async (): Promise<IRoom | undefined> => roomsCollection.findOne({ _id: rid }, { reactive: false });

	const getRoom = async (): Promise<IRoom> => {
		const room = await findRoom();

		if (!room) {
			throw new Error('Room not found');
		}

		return room;
	};

	const isSubscribedToRoom = async (): Promise<boolean> => !!subscriptionsCollection.findOne({ rid }, { reactive: false });

	const joinRoom = async (): Promise<void> => call('joinRoom', rid);

	const markRoomAsRead = async (): Promise<void> => {
		readMessage.readNow(rid);
		readMessage.refreshUnreadMark(rid);
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

	return {
		composeMessage,
		findMessageByID,
		getMessageByID,
		findLastMessage,
		getLastMessage,
		findLastOwnMessage,
		getLastOwnMessage,
		findPreviousOwnMessage,
		getPreviousOwnMessage,
		findNextOwnMessage,
		getNextOwnMessage,
		pushEphemeralMessage,
		canUpdateMessage,
		updateMessage,
		canDeleteMessage,
		deleteMessage,
		getDraft,
		saveDraft,
		discardDraft,
		findRoom,
		getRoom,
		isSubscribedToRoom,
		joinRoom,
		markRoomAsRead,
		findDiscussionByID,
		getDiscussionByID,
	};
};
