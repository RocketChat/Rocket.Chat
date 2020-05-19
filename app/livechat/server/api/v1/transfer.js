import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { LivechatRooms } from '../../../../models';
import { API } from '../../../../api';
import { findLivechatTransferHistory } from '../lib/transfer';

API.v1.addRoute('livechat/transfer.history/:rid', { authRequired: true }, {
	get() {
		try {
			check(this.urlParams, {
				rid: String,
			});

			const { rid } = this.urlParams;

			const room = LivechatRooms.findOneById(rid);
			if (!room || room.t !== 'l') {
				throw new Meteor.Error('invalid-room');
			}

			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();

			const history = Promise.await(findLivechatTransferHistory({
				userId: this.userId,
				rid,
				pagination: {
					offset,
					count,
					sort,
				},
			}));

			return API.v1.success(history);
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
