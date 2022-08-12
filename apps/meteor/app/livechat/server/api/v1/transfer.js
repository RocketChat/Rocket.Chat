import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { LivechatRooms } from '../../../../models/server';
import { API } from '../../../../api/server';
import { findLivechatTransferHistory } from '../lib/transfer';

API.v1.addRoute(
	'livechat/transfer.history/:rid',
	{ authRequired: true, permissionsRequired: ['view-livechat-rooms'] },
	{
		async get() {
			check(this.urlParams, {
				rid: String,
			});

			const { rid } = this.urlParams;

			const room = LivechatRooms.findOneById(rid, { _id: 1 });
			if (!room) {
				throw new Meteor.Error('invalid-room');
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
