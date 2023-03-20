import { LivechatRooms } from '../../../../models/server';
import { API } from '../../../../api/server';
import { findLivechatTransferHistory } from '../lib/transfer';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { parseJsonQuery } from '../../../../api/server/helpers/parseJsonQuery';

API.v1.addRoute(
	'livechat/transfer.history/:rid',
	{ authRequired: true, permissionsRequired: ['view-livechat-rooms'] },
	{
		async get() {
			const { rid } = this.urlParams;

			const room = LivechatRooms.findOneById(rid, { _id: 1 });
			if (!room) {
				throw new Error('invalid-room');
			}
			const params = this.queryParams as unknown as Record<string, any>;
			const { offset, count } = await getPaginationItems(params);
			const { sort } = await parseJsonQuery(this.request.route, this.userId, params, this.logger, this.queryFields, this.queryOperations);

			const history = await findLivechatTransferHistory({
				rid,
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(history);
		},
	},
);
