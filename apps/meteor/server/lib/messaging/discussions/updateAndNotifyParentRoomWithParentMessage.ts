import type { IRoom, MessageTypesValues } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { settings } from '../../../settings/cached';
import { notifyOnMessageChange } from '../../notifyListener';

type DiscussionRoom = Pick<IRoom, '_id' | 'msgs' | 'lm' | 'sysMes'>;

/**
 * Both the system messages hidden globally and the ones hidden on the room itself are
 * filtered out from the room history, so the count has to consider both of them.
 * Type `rm` is filtered out because it's already discounted when the message is deleted.
 */
const getHiddenTypesToDiscount = (room: DiscussionRoom): MessageTypesValues[] => {
	const globalHiddenTypes = settings.get<MessageTypesValues[]>('Hide_System_Messages');
	const globallyHiddenTypes = Array.isArray(globalHiddenTypes) ? globalHiddenTypes : [];
	const roomHiddenTypes = Array.isArray(room.sysMes) ? room.sysMes : [];

	return [...new Set([...globallyHiddenTypes, ...roomHiddenTypes])]
		.flatMap<MessageTypesValues>((type) =>
			// `mute_unmute` is a single option covering two different message types
			type === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [type],
		)
		.filter((type) => type !== 'rm');
};

const getDiscussionMessagesCount = async (room: DiscussionRoom): Promise<number> => {
	const hiddenMessageTypes = getHiddenTypesToDiscount(room);

	if (!hiddenMessageTypes.length) {
		return room.msgs;
	}

	const hiddenMessagesCount = await Messages.countVisibleByRoomIdContainingTypes(room._id, hiddenMessageTypes);

	return Math.max(room.msgs - hiddenMessagesCount, 0);
};

/**
 * Copies the current metadata of a discussion (messages count and last message timestamp) to the
 *  message which links to it on the parent room, and notifies the change to the clients.
 */
export const updateAndNotifyParentRoomWithParentMessage = async (room: DiscussionRoom): Promise<void> => {
	room.msgs = await getDiscussionMessagesCount(room);

	const parentMessage = await Messages.refreshDiscussionMetadata(room);
	if (!parentMessage) {
		return;
	}

	void notifyOnMessageChange({
		id: parentMessage._id,
		data: parentMessage,
	});
};
