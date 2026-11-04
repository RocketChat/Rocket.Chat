import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import type { MessageHistoryVisibility, UploadHistoryVisibility } from '@rocket.chat/model-typings';
import { Messages } from '@rocket.chat/models';
import { makeFunction } from '@rocket.chat/patch-injection';
import type { Filter } from 'mongodb';

export type HistoryCheckedMessage = Pick<IMessage, '_id' | 'rid' | 'ts' | 'tmid' | 'tshow' | 'replies'>;

/** Fields a message must be fetched with for `getHiddenMessageIds`. */
export const historyCheckedMessageProjection = { _id: 1, rid: 1, ts: 1, tmid: 1, tshow: 1, replies: 1 } as const;

/** What the user can read in the room; undefined when nothing is hidden from them. */
export const getHistoryVisibility = makeFunction(
	async (_uid: IUser['_id'] | undefined, _rid: IRoom['_id']): Promise<MessageHistoryVisibility | undefined> => undefined,
);

/** The ids, among these messages, that the user can't read because of their history restriction in each message's room. */
export const getHiddenMessageIds = makeFunction(
	async (_uid: IUser['_id'] | undefined, _messages: HistoryCheckedMessage[]): Promise<Set<IMessage['_id']>> => new Set(),
);

/** The date a member joining the room at `joinedAt` can read it from; undefined for its full history. */
export const getHistoryVisibleFromForNewMember = makeFunction(
	async (_room: Pick<IRoom, '_id' | 't' | 'federated' | 'hideHistoryForNewMembers'>, _joinedAt: Date): Promise<Date | undefined> =>
		undefined,
);

/** Members of the message's room who can't read it because of their history restriction. */
export const getMembersWithoutAccessToMessage = makeFunction(
	async (_message: HistoryCheckedMessage): Promise<Set<IUser['_id']>> => new Set(),
);

/** The date the user can read the room from; undefined when nothing is hidden from them. */
export const getHistoryVisibleFrom = makeFunction(
	async (_uid: IUser['_id'] | undefined, _rid: IRoom['_id']): Promise<Date | undefined> => undefined,
);

export const canSeeMessage = async (uid: IUser['_id'] | undefined, message: HistoryCheckedMessage): Promise<boolean> =>
	!(await getHiddenMessageIds(uid, [message])).has(message._id);

/** Narrows a query on one room's messages to what the user can read there. */
export const restrictToVisibleHistory = async (
	uid: IUser['_id'] | undefined,
	rid: IRoom['_id'],
	query: Filter<IMessage>,
): Promise<Filter<IMessage>> => {
	const visibility = await getHistoryVisibility(uid, rid);
	return visibility ? { $and: [query, Messages.filterVisibleTo(visibility)] } : query;
};

/** The files the user can see in the room; undefined when nothing is hidden from them. */
export const getUploadVisibility = async (
	uid: IUser['_id'] | undefined,
	rid: IRoom['_id'],
): Promise<UploadHistoryVisibility | undefined> => {
	const visibility = await getHistoryVisibility(uid, rid);
	if (!visibility) {
		return undefined;
	}

	const [hiddenFileIds, followedFileIds] = await Promise.all([
		Messages.findFileIdsInThreads(rid, visibility.hiddenThreadIds, { withRoots: false, withAlsoSentToChannel: false }),
		Messages.findFileIdsInThreads(rid, visibility.followedThreadIds, { withRoots: true, withAlsoSentToChannel: true }),
	]);

	return { since: visibility.since, hiddenFileIds, followedFileIds };
};

/** The rooms as the user may see them, without a last message the user can't read. */
export const withVisibleLastMessage = async <T extends Pick<IRoom, 'lastMessage'>>(
	uid: IUser['_id'] | undefined,
	rooms: T[],
): Promise<T[]> => {
	const lastMessages = rooms.flatMap(({ lastMessage }) => (lastMessage ? [lastMessage] : []));
	if (!lastMessages.length) {
		return rooms;
	}

	const hiddenMessageIds = await getHiddenMessageIds(uid, lastMessages);
	if (!hiddenMessageIds.size) {
		return rooms;
	}

	return rooms.map((room) => {
		if (!room.lastMessage || !hiddenMessageIds.has(room.lastMessage._id)) {
			return room;
		}
		const { lastMessage: _hidden, ...visibleRoom } = room;
		return visibleRoom as T;
	});
};
