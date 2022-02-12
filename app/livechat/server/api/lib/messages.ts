import { IMessage } from '../../../../../definition/IMessage/IMessage';
import { LivechatExternalMessage } from '../../../../models/server/raw';

export async function findExternalMessages({
	roomId,
	pagination,
}: {
	roomId: string;
	pagination: { offset: number; count: number; sort: string };
}): Promise<{ messages: IMessage[]; count: number; offset: number; total: number }> {
	const cursor = await LivechatExternalMessage.findByRoomId(roomId, {
		sort: pagination.sort || { ts: -1 },
		skip: pagination.offset,
		limit: pagination.count,
	});

	const total = await cursor.count();

	const messages = await cursor.toArray();

	return {
		messages,
		count: messages.length,
		offset: pagination.offset,
		total,
	};
}
