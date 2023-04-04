import { LivechatRooms } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { findLivechatTransferHistory } from '../lib/transfer';

API.v1.addRoute(
	'livechat/transfer.history/:rid',
	{ authRequired: true, permissionsRequired: ['view-livechat-rooms'] },
	{
		async get() {
			const { rid } = this.urlParams;

			const room = await LivechatRooms.findOneById(rid, { projection: { _id: 1 } });
			if (!room) {
				throw new Error('invalid-room');
			}

			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

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
