
import { check } from 'meteor/check';

import { API } from '../../../../api';
import { findExternalMessages } from '../../../server/api/lib/messages';

API.v1.addRoute('livechat/messages.external', { authRequired: true }, {
	get() {
		check(this.queryParams, {
			roomId: String,
		});
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		const departments = Promise.await(findExternalMessages({
			roomId: this.queryParams.roomId,
			pagination: {
				offset,
				count,
				sort,
			},
		}));

		return API.v1.success(departments);
	},
});
