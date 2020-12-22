import { useEffect } from 'react';

import { MessageMap } from './useMessageList';
import { useStream } from '../../../../../contexts/ServerContext';
import { IMessage } from '../../../../../../definition/IMessage';
import { FieldExpression, createFilterFromQuery, Query } from '../../../../../lib/minimongo';
import { useUserId } from '../../../../../contexts/UserContext';

type RoomMessagesRidEvent = IMessage;
type NotifyRoomRidDeleteMessageEvent = { _id: IMessage['_id'] };
type NotifyRoomRidDeleteMessageBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: FieldExpression<Date>;
	users: string[];
};

const isStarredMessage = (
	message: IMessage,
	rid: IMessage['rid'],
	uid: Exclude<IMessage['starred'], undefined>[number]['_id'],
): boolean => {
	if (message.rid !== rid) {
		return false;
	}

	if (!Array.isArray(message.starred)) {
		return false;
	}

	if (!message.starred.some(({ _id }) => _id === uid)) {
		return false;
	}

	if (message._hidden) {
		return false;
	}

	return true;
};

const createDeleteCriteria = (params: NotifyRoomRidDeleteMessageBulkEvent): ((message: IMessage) => boolean) => {
	const query: Query<IMessage> = { ts: params.ts };

	if (params.excludePinned) {
		query.pinned = { $ne: true };
	}

	if (params.ignoreDiscussion) {
		query.drid = { $exists: false };
	}
	if (params.users && params.users.length) {
		query['u.username'] = { $in: params.users };
	}

	return createFilterFromQuery<IMessage>(query);
};

export const useStarredMessagesFromStreams = (
	rid: IMessage['rid'],
	update: (mutation: (prev: MessageMap) => Promise<void>) => void,
): void => {
	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToNotifyRoom = useStream('notify-room');
	const uid = useUserId();

	useEffect(() => {
		if (!uid) {
			return;
		}

		return subscribeToRoomMessages<RoomMessagesRidEvent>(rid, (message) => {
			update(async (map) => {
				if (isStarredMessage(message, rid, uid)) {
					map.set(message._id, message);
					return;
				}

				map.delete(message._id);
			});
		});
	}, [subscribeToRoomMessages, rid, uid, update]);

	useEffect(() => {
		if (!uid) {
			return;
		}

		return subscribeToNotifyRoom<NotifyRoomRidDeleteMessageEvent>(`${ rid }/deleteMessage`, ({ _id: mid }) => {
			update(async (map) => {
				map.delete(mid);
			});
		});
	}, [subscribeToNotifyRoom, rid, update, uid]);

	useEffect(() => {
		if (!uid) {
			return;
		}

		return subscribeToNotifyRoom<NotifyRoomRidDeleteMessageBulkEvent>(`${ rid }/deleteMessageBulk`, (params) => {
			const matchDeleteCriteria = createDeleteCriteria(params);

			update(async (map) => {
				for (const message of map.values()) {
					if (matchDeleteCriteria(message)) {
						map.delete(message._id);
					}
				}
			});
		});
	}, [subscribeToNotifyRoom, rid, uid, update]);
};
