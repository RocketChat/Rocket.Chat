import { Messages } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

const normalizeTransferHistory = ({ transferData }) => transferData;
export async function findLivechatTransferHistory({ userId, rid, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'view-livechat-rooms'))) {
		throw new Error('error-not-authorized');
	}

	const cursor = await Messages.find(
		{ rid, t: 'livechat_transfer_history' },
		{
			fields: { transferData: 1 },
			sort: sort || { ts: 1 },
			skip: offset,
			limit: count,
		},
	);

	const total = await cursor.count();
	const messages = await cursor.toArray();
	const history = messages.map(normalizeTransferHistory);

	return {
		history,
		count: history.length,
		offset,
		total,
	};
}
