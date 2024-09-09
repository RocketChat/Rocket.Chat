import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';


export async function markAllMessagesAsDone({
	rid = '',
	userId = '',
}: {
	rid?: IRoom['_id'];
	userId?: IUser['_id'];
}): Promise<void> {

	await Messages.markAllMessagesAsDoneByRoomIdAndUserId(
		rid,
		userId
	);

	const lastMessage = await Messages.getLastVisibleUserMessageSentByRoomId(rid);
	await Rooms.resetLastMessageById(rid, lastMessage);
	/*
	void api.broadcast('notify.deleteMessageBulk', rid, {
		rid,
		excludePinned,
		ignoreDiscussion,
		ts,
		users: fromUsers,
	});
	*/
}
