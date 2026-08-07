import type { IRoom } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { notifyOnMessageChange } from '../../notifyListener';

export const updateAndNotifyParentRoomWithParentMessage = async (room: IRoom): Promise<void> => {
	const parentMessage = await Messages.refreshDiscussionMetadata(room);
	if (!parentMessage) {
		return;
	}
	void notifyOnMessageChange({
		id: parentMessage._id,
		data: parentMessage,
	});
};
