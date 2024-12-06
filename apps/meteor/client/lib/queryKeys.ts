import type { IMessage, IRoom, Serialized } from '@rocket.chat/core-typings';

export const roomsQueryKeys = {
	all: ['rooms'] as const,
	room: (rid: IRoom['_id']) => ['rooms', rid] as const,
	starredMessages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'starred-messages'] as const,
	pinnedMessages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'pinned-messages'] as const,
	messages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'messages'] as const,
	message: (rid: IRoom['_id'], mid: IMessage['_id']) => [...roomsQueryKeys.messages(rid), mid] as const,
	messageActions: (rid: IRoom['_id'], mid: IMessage['_id']) => [...roomsQueryKeys.message(rid, mid), 'actions'] as const,
	messageActionsWithParameters: (rid: IRoom['_id'], message: IMessage | Serialized<IMessage>) =>
		[...roomsQueryKeys.messageActions(rid, message._id), message] as const,
	threads: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'threads'] as const,
};

export const subscriptionsQueryKeys = {
	all: ['subscriptions'] as const,
	subscription: (rid: IRoom['_id']) => [...subscriptionsQueryKeys.all, { rid }] as const,
};
