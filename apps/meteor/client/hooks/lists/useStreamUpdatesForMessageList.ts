import type { IMessage, IRoom, IUser, MessageAttachment } from '@rocket.chat/core-typings';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import { useStream } from '@rocket.chat/ui-contexts';
import type { Condition, Filter } from 'mongodb';
import { useEffect } from 'react';

import type { MessageList } from '../../lib/lists/MessageList';
import { modifyMessageOnFilesDelete } from '../../lib/utils/modifyMessageOnFilesDelete';

type NotifyRoomRidDeleteBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: Condition<Date>;
	users: string[];
	ids?: string[]; // message ids have priority over ts
} & (
	| {
			filesOnly: true;
			replaceFileAttachmentsWith?: MessageAttachment;
	  }
	| {
			filesOnly?: false;
	  }
);

const createDeleteCriteria = (params: NotifyRoomRidDeleteBulkEvent): ((message: IMessage) => boolean) => {
	const query: Filter<IMessage> = {};

	if (params.ids) {
		query._id = { $in: params.ids };
	} else {
		query.ts = params.ts;
	}

	if (params.excludePinned) {
		query.pinned = { $ne: true };
	}

	if (params.ignoreDiscussion) {
		query.drid = { $exists: false };
	}
	if (params.users?.length) {
		query['u.username'] = { $in: params.users };
	}

	return createPredicateFromFilter(query);
};

export const useStreamUpdatesForMessageList = (messageList: MessageList, uid: IUser['_id'] | null, rid: IRoom['_id'] | null): void => {
	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');

	useEffect(() => {
		if (!uid || !rid) {
			messageList.clear();
			return;
		}

		const unsubscribeFromRoomMessages = subscribeToRoomMessages(rid, (message) => {
			messageList.handle(message);
		});

		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom(`${rid}/deleteMessage`, ({ _id: mid }) => {
			messageList.remove(mid);
		});

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom(`${rid}/deleteMessageBulk`, (params) => {
			const matchDeleteCriteria = createDeleteCriteria(params);
			if (params.filesOnly) {
				const items = messageList.items.filter(matchDeleteCriteria).map((message) => {
					return modifyMessageOnFilesDelete(message, params.replaceFileAttachmentsWith);
				});

				return messageList.batchHandle(() => Promise.resolve({ items }));
			}
			messageList.prune(matchDeleteCriteria);
		});

		return (): void => {
			unsubscribeFromRoomMessages();
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
		};
	}, [subscribeToRoomMessages, subscribeToNotifyRoom, uid, rid, messageList]);
};
