import { useEffect } from 'react';

import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { ITask } from '../../../definition/ITask';
import { IUser } from '../../../definition/IUser';
import { useStream } from '../../contexts/ServerContext';
import { MessageList } from '../../lib/lists/MessageList';
import { TaskList } from '../../lib/lists/TaskList';
import { createFilterFromQuery, FieldExpression, Query } from '../../lib/minimongo';

type RoomMessagesRidEvent = IMessage;

type RoomTasksRidEvent = ITask;

type NotifyRoomRidDeleteMessageEvent = { _id: IMessage['_id'] };

type NotifyRoomRidDeleteMessageBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: FieldExpression<Date>;
	users: string[];
};

const createDeleteCriteria = (
	params: NotifyRoomRidDeleteMessageBulkEvent,
): ((message: IMessage) => boolean) => {
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

export const useStreamUpdatesForMessageList = (
	messageList: MessageList,
	taskList: TaskList,
	uid: IUser['_id'] | null,
	rid: IRoom['_id'] | null,
): void => {
	const subscribeToRoomMessages = useStream('room-messages');
	const subscribeToRoomTasks = useStream('room-tasks');
	const subscribeToNotifyRoom = useStream('notify-room');

	useEffect(() => {
		if (!uid || !rid) {
			messageList.clear();
			return;
		}

		const unsubscribeFromRoomMessages = subscribeToRoomMessages<RoomMessagesRidEvent>(
			rid,
			(message) => {
				messageList.handle(message);
			},
		);

		const unsubscribeFromRoomTasks = subscribeToRoomTasks<RoomTasksRidEvent>(rid, (task) => {
			taskList.handle(task);
		});

		const unsubscribeFromDeleteMessage = subscribeToNotifyRoom<NotifyRoomRidDeleteMessageEvent>(
			`${rid}/deleteMessage`,
			({ _id: mid }) => {
				messageList.remove(mid);
			},
		);

		const unsubscribeFromDeleteMessageBulk = subscribeToNotifyRoom<NotifyRoomRidDeleteMessageBulkEvent>(
			`${rid}/deleteMessageBulk`,
			(params) => {
				const matchDeleteCriteria = createDeleteCriteria(params);
				messageList.prune(matchDeleteCriteria);
			},
		);

		return (): void => {
			unsubscribeFromRoomMessages();
			unsubscribeFromRoomTasks();
			unsubscribeFromDeleteMessage();
			unsubscribeFromDeleteMessageBulk();
		};
	}, [
		subscribeToRoomMessages,
		subscribeToNotifyRoom,
		uid,
		rid,
		messageList,
		subscribeToRoomTasks,
		taskList,
	]);
};
