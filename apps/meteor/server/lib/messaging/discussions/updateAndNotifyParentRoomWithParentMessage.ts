import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { settings } from '../../../settings/cached';
import { notifyOnMessageChange } from '../../notifyListener';

type DiscussionRoom = Pick<IRoom, '_id' | 'msgs' | 'lm' | 'sysMes'>;

/**
 * `mute_unmute` is a single option covering two different message types, and `rm` is filtered
 * out because it's already discounted when the message is deleted.
 */
export const expandHiddenSystemMessageTypes = (types: unknown): Set<MessageTypesValues> =>
	new Set(
		(Array.isArray(types) ? (types as MessageTypesValues[]) : [])
			.flatMap<MessageTypesValues>((type) => (type === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [type]))
			.filter((type) => type !== 'rm'),
	);

/**
 * Both the system messages hidden globally and the ones hidden on the room itself are
 * filtered out from the room history, so the count has to consider both of them.
 */
const getHiddenTypesToDiscount = (room: Pick<IRoom, 'sysMes'>): MessageTypesValues[] => {
	const globalHiddenTypes = settings.get<MessageTypesValues[]>('Hide_System_Messages');
	const roomHiddenTypes = Array.isArray(room.sysMes) ? room.sysMes : [];

	return [...expandHiddenSystemMessageTypes([...(Array.isArray(globalHiddenTypes) ? globalHiddenTypes : []), ...roomHiddenTypes])];
};

const getDiscussionMessagesCount = async (room: DiscussionRoom): Promise<number> => {
	const hiddenMessageTypes = getHiddenTypesToDiscount(room);

	if (!hiddenMessageTypes.length) {
		return room.msgs;
	}

	const hiddenMessagesCount = await Messages.countVisibleByRoomIdContainingTypes(room._id, hiddenMessageTypes);

	return Math.max(room.msgs - hiddenMessagesCount, 0);
};

const notifyParentMessage = (parentMessage: IMessage | null): void => {
	if (!parentMessage) {
		return;
	}

	void notifyOnMessageChange({
		id: parentMessage._id,
		data: parentMessage,
	});
};

/**
 * Only meant for when the set of hidden system message types changes; regular message activity
 * goes through `incrementAndNotifyParentRoomWithParentMessage` instead.
 */
export const updateAndNotifyParentRoomWithParentMessage = async (room: DiscussionRoom): Promise<void> => {
	const msgs = await getDiscussionMessagesCount(room);

	notifyParentMessage(await Messages.refreshDiscussionMetadata({ ...room, msgs }));
};

export const incrementAndNotifyParentRoomWithParentMessage = async (
	room: Pick<IRoom, '_id' | 'lm' | 'sysMes'>,
	messageType: IMessage['t'],
	countDelta: number,
): Promise<void> => {
	const isHidden = !!messageType && getHiddenTypesToDiscount(room).includes(messageType);

	notifyParentMessage(await Messages.incDiscussionMetadata(room, isHidden ? 0 : countDelta));
};
