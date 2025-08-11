import { type IEditedMessage, type IMessage, type IRoom, type ISubscription } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import moment from 'moment';

import type { DataAPI } from './ChatAPI';
import { hasAtLeastOnePermission, hasPermission } from '../../../app/authorization/client';
import { settings } from '../../../app/settings/client';
import { MessageTypes } from '../../../app/ui-utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { Messages, Rooms, Subscriptions } from '../../stores';
import { prependReplies } from '../utils/prependReplies';

export const createDataAPI = ({ rid, tmid }: { rid: IRoom['_id']; tmid: IMessage['_id'] | undefined }): DataAPI => {
	const composeMessage = async (
		text: string,
		{ sendToChannel, quotedMessages, originalMessage }: { sendToChannel?: boolean; quotedMessages: IMessage[]; originalMessage?: IMessage },
	): Promise<IMessage> => {
		const msg = await prependReplies(text, quotedMessages);

		const effectiveRID = originalMessage?.rid ?? rid;
		const effectiveTMID = originalMessage ? originalMessage.tmid : tmid;

		return {
			_id: originalMessage?._id ?? Random.id(),
			rid: effectiveRID,
			...(effectiveTMID && {
				tmid: effectiveTMID,
				...(sendToChannel && { tshow: sendToChannel }),
			}),
			msg,
		} as IMessage;
	};

	const findMessageByID = async (mid: IMessage['_id']): Promise<IMessage | null> =>
		Messages.state.find((record) => record._id === mid && record._hidden !== true) ?? sdk.call('getSingleMessage', mid);

	const getMessageByID = async (mid: IMessage['_id']): Promise<IMessage> => {
		const message = await findMessageByID(mid);

		if (!message) {
			throw new Error('Message not found');
		}

		return message;
	};

	const findLastMessage = async (): Promise<IMessage | undefined> =>
		Messages.state.findFirst(
			(record) => record.rid === rid && (tmid ? record.tmid === tmid : !record.tmid) && record._hidden !== true,
			(a, b) => b.ts.getTime() - a.ts.getTime(),
		);

	const getLastMessage = async (): Promise<IMessage> => {
		const message = await findLastMessage();

		if (!message) {
			throw new Error('Message not found');
		}

		return message;
	};

	const canUpdateMessage = async (message: IMessage): Promise<boolean> => {
		if (MessageTypes.isSystemMessage(message)) {
			return false;
		}

		const canEditMessage = hasAtLeastOnePermission('edit-message', message.rid);
		const editAllowed = (settings.get('Message_AllowEditing') as boolean | undefined) ?? false;
		const editOwn = message?.u && message.u._id === Meteor.userId();

		if (!canEditMessage && (!editAllowed || !editOwn)) {
			return false;
		}

		const blockEditInMinutes = settings.get('Message_AllowEditing_BlockEditInMinutes') as number | undefined;
		const bypassBlockTimeLimit = hasPermission('bypass-time-limit-edit-and-delete', message.rid);

		const elapsedMinutes = moment().diff(message.ts, 'minutes');
		if (!bypassBlockTimeLimit && elapsedMinutes && blockEditInMinutes && elapsedMinutes > blockEditInMinutes) {
			return false;
		}

		return true;
	};

	const findPreviousOwnMessage = async (message?: IMessage): Promise<IMessage | undefined> => {
		const uid = Meteor.userId();

		if (!uid) {
			return undefined;
		}

		const msg = Messages.state.findFirst(
			(record) =>
				record.rid === rid &&
				(tmid ? record.tmid === tmid : !record.tmid) &&
				record.u._id === uid &&
				record._hidden !== true &&
				record.ts.getTime() < (message?.ts.getTime() ?? Date.now()),
			(a, b) => b.ts.getTime() - a.ts.getTime(),
		);

		if (!msg) {
			return undefined;
		}

		if (await canUpdateMessage(msg)) {
			return msg;
		}

		return findPreviousOwnMessage(msg);
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

		const msg = Messages.state.findFirst(
			(record) =>
				record.rid === rid &&
				(tmid ? record.tmid === tmid : !record.tmid) &&
				record.u._id === uid &&
				record._hidden !== true &&
				record.ts.getTime() > message.ts.getTime(),
			(a, b) => a.ts.getTime() - b.ts.getTime(),
		);

		if (!msg) {
			return undefined;
		}

		if (await canUpdateMessage(msg)) {
			return msg;
		}

		return findNextOwnMessage(msg);
	};

	const getNextOwnMessage = async (message: IMessage): Promise<IMessage> => {
		const nextMessage = await findNextOwnMessage(message);

		if (!nextMessage) {
			throw new Error('Message not found');
		}

		return nextMessage;
	};

	const pushEphemeralMessage = async (message: Omit<IMessage, 'rid' | 'tmid'>): Promise<void> => {
		Messages.state.store({ ...message, rid, ...(tmid && { tmid }) });
	};

	const updateMessage = async (message: IEditedMessage, previewUrls?: string[]): Promise<void> =>
		sdk.call('updateMessage', message, previewUrls);

	const canDeleteMessage = async (message: IMessage): Promise<boolean> => {
		const uid = Meteor.userId();

		if (!uid) {
			return false;
		}

		if (MessageTypes.isSystemMessage(message)) {
			return false;
		}

		const forceDeleteAllowed = hasPermission('force-delete-message', message.rid);
		if (forceDeleteAllowed) {
			return true;
		}

		const deletionEnabled = settings.get('Message_AllowDeleting') as boolean | undefined;
		if (!deletionEnabled) {
			return false;
		}

		const deleteAnyAllowed = hasPermission('delete-message', rid);
		const deleteOwnAllowed = hasPermission('delete-own-message');
		const deleteAllowed = deleteAnyAllowed || (deleteOwnAllowed && message?.u && message.u._id === Meteor.userId());

		if (!deleteAllowed) {
			return false;
		}

		const blockDeleteInMinutes = settings.get('Message_AllowDeleting_BlockDeleteInMinutes') as number | undefined;
		const bypassBlockTimeLimit = hasPermission('bypass-time-limit-edit-and-delete', message.rid);
		const elapsedMinutes = moment().diff(message.ts, 'minutes');
		const onTimeForDelete = bypassBlockTimeLimit || !blockDeleteInMinutes || !elapsedMinutes || elapsedMinutes <= blockDeleteInMinutes;

		return deleteAllowed && onTimeForDelete;
	};

	const deleteMessage = async (msgIdOrMsg: IMessage | IMessage['_id']): Promise<void> => {
		let msgId: string;
		let roomId: string;
		if (typeof msgIdOrMsg === 'string') {
			msgId = msgIdOrMsg;
			const msg = await findMessageByID(msgId);
			if (!msg) {
				throw new Error('Message not found');
			}
			roomId = msg.rid;
		} else {
			msgId = msgIdOrMsg._id;
			roomId = msgIdOrMsg.rid;
		}

		await sdk.rest.post('/v1/chat.delete', { msgId, roomId });
	};

	const drafts = new Map<IMessage['_id'] | undefined, string>();

	const getDraft = async (mid: IMessage['_id'] | undefined): Promise<string | undefined> => drafts.get(mid);

	const discardDraft = async (mid: IMessage['_id'] | undefined): Promise<void> => {
		drafts.delete(mid);
	};

	const saveDraft = async (mid: IMessage['_id'] | undefined, draft: string): Promise<void> => {
		drafts.set(mid, draft);
	};

	const findRoom = async (): Promise<IRoom | undefined> => Rooms.state.get(rid);

	const getRoom = async (): Promise<IRoom> => {
		const room = await findRoom();

		if (!room) {
			throw new Error('Room not found');
		}

		return room;
	};

	const isSubscribedToRoom = async (): Promise<boolean> => !!Subscriptions.state.find((record) => record.rid === rid);

	const joinRoom = async (): Promise<void> => {
		await sdk.call('joinRoom', rid);
	};

	const findDiscussionByID = async (drid: IRoom['_id']): Promise<IRoom | undefined> =>
		Rooms.state.find((record) => Boolean(record._id === drid && record.prid));

	const getDiscussionByID = async (drid: IRoom['_id']): Promise<IRoom> => {
		const discussion = await findDiscussionByID(drid);

		if (!discussion) {
			throw new Error('Discussion not found');
		}

		return discussion;
	};

	const createStrictGetter = <TFind extends (...args: any[]) => Promise<any>>(
		find: TFind,
		errorMessage: string,
	): ((...args: Parameters<TFind>) => Promise<Exclude<Awaited<ReturnType<TFind>>, undefined>>) => {
		return async (...args) => {
			const result = await find(...args);

			if (!result) {
				throw new Error(errorMessage);
			}

			return result;
		};
	};

	const findSubscription = async (): Promise<ISubscription | undefined> => {
		return Subscriptions.state.find((record) => record.rid === rid);
	};

	const getSubscription = createStrictGetter(findSubscription, 'Subscription not found');

	const findSubscriptionFromMessage = async (message: IMessage): Promise<ISubscription | undefined> => {
		return Subscriptions.state.find((record) => record.rid === message.rid);
	};

	const getSubscriptionFromMessage = createStrictGetter(findSubscriptionFromMessage, 'Subscription not found');

	return {
		composeMessage,
		findMessageByID,
		getMessageByID,
		findLastMessage,
		getLastMessage,
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
		findDiscussionByID,
		getDiscussionByID,
		findSubscription,
		getSubscription,
		findSubscriptionFromMessage,
		getSubscriptionFromMessage,
	};
};
