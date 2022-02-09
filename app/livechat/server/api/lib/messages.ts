import { LivechatExternalMessage } from '../../../../models/server/raw';

type IPaginationParam = { pagination: { offset: number; count: number; sort: Record<string, any> } };

export async function findExternalMessages(
	roomId: string,
	{ pagination: { offset, count, sort } }: IPaginationParam,
): Promise<{ messages: any; count: number; offset: number; total: number }> {
	const cursor = await LivechatExternalMessage.findByRoomId(roomId, {
		sort: sort || { ts: -1 },
		skip: offset,
		limit: count,
	});

	const total = await cursor.count();

	const messages = await cursor.toArray();

	return {
		messages,
		count: messages.length,
		offset,
		total,
	};
}
