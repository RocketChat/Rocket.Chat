import type { IMessage, MessageAttachment } from '@rocket.chat/core-typings';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import type { QueryClient } from '@tanstack/react-query';
import type { Condition, Filter } from 'mongodb';

import { queryClient as defaultQueryClient } from '../queryClient';
import { roomsQueryKeys } from '../queryKeys';

export type NotifyRoomRidDeleteBulkEvent = {
	rid: IMessage['rid'];
	excludePinned: boolean;
	ignoreDiscussion: boolean;
	ts: Condition<Date>;
	users: string[];
	ids?: string[];
	showDeletedStatus?: boolean;
} & (
	| {
			filesOnly: true;
			replaceFileAttachmentsWith?: MessageAttachment;
	  }
	| {
			filesOnly?: false;
	  }
);

export const createDeleteCriteria = (params: NotifyRoomRidDeleteBulkEvent): ((message: IMessage) => boolean) => {
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

export const upsertThreadMessageInCache = (
	message: IMessage,
	rid: IMessage['rid'],
	tmid: IMessage['_id'],
	client: QueryClient = defaultQueryClient,
): void => {
	const queryKey = roomsQueryKeys.threadMessages(rid, tmid);
	client.setQueryData<IMessage[]>(queryKey, (old) => {
		if (!old) {
			return [message];
		}
		const idx = old.findIndex((m) => m._id === message._id);
		if (idx >= 0) {
			const updated = [...old];
			updated[idx] = message;
			return updated;
		}
		return [...old, message].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
	});
};
