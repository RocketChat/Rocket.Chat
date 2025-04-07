import type { IMessage, IRoom } from '@rocket.chat/core-typings';

export const roomsQueryKeys = {
	all: ['rooms'] as const,
	room: (rid: IRoom['_id']) => ['rooms', rid] as const,
	starredMessages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'starred-messages'] as const,
	pinnedMessages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'pinned-messages'] as const,
	messages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'messages'] as const,
	message: (rid: IRoom['_id'], mid: IMessage['_id']) => [...roomsQueryKeys.messages(rid), mid] as const,
	threads: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'threads'] as const,
	roles: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'roles'] as const,
};

export const subscriptionsQueryKeys = {
	all: ['subscriptions'] as const,
	subscription: (rid: IRoom['_id']) => [...subscriptionsQueryKeys.all, { rid }] as const,
};

export const cannedResponsesQueryKeys = {
	all: ['canned-responses'] as const,
};

export const rolesQueryKeys = {
	all: ['roles'] as const,
	userRoles: () => [...rolesQueryKeys.all, 'user-roles'] as const,
};
