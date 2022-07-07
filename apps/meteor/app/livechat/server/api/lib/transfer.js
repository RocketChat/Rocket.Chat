import { Messages } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';

const normalizeTransferHistory = ({ transferData }) => transferData;
export async function findLivechatTransferHistory({ userId, rid, pagination: { offset, count, sort } }) {
	if (!(await hasPermissionAsync(userId, 'view-livechat-rooms'))) {
		throw new Error('error-not-authorized');
	}

	const { cursor, totalCount } = Messages.findPaginated(
		{ rid, t: 'livechat_transfer_history' },
		{
			projection: { transferData: 1 },
			sort: sort || { ts: 1 },
			skip: offset,
			limit: count,
		},
	);

	const [history, total] = await Promise.all([cursor.map(normalizeTransferHistory).toArray(), totalCount]);

	return {
		history,
		count: history.length,
		offset,
		total,
	};
}
