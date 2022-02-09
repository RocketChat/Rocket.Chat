import { SortOptionObject } from 'mongodb';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { Messages } from '../../../../models/server/raw';
import { IMessage } from '../../../../../definition/IMessage';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const normalizeTransferHistory = ({ transferData }: { transferData: number }) => transferData;

export async function findLivechatTransferHistory({
	userId,
	rid,
	pagination,
}: {
	userId: string;
	rid: string;
	pagination: { offset: number; count: number; sort: SortOptionObject<IMessage> };
}): Promise<{ history: number[]; count: number; offset: number; total: number }> {
	if (!(await hasPermissionAsync(userId, 'view-livechat-rooms'))) {
		throw new Error('error-not-authorized');
	}

	const cursor = await Messages.find(
		{ rid, t: 'livechat_transfer_history' },
		{
			fields: { transferData: 1 },
			sort: pagination.sort || { ts: 1 },
			skip: pagination.offset,
			limit: pagination.count,
		},
	);

	const total = await cursor.count();
	const messages = await cursor.toArray();
	const history = messages.map(normalizeTransferHistory);

	return {
		history,
		count: history.length,
		offset: pagination.offset,
		total,
	};
}
