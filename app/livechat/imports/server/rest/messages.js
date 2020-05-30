
import { check } from 'meteor/check';

import { API } from '../../../../../server/api';
import { findExternalMessages } from '../../../server/api/lib/messages';

API.v1.addRoute('livechat/messages.external/:roomId', { authRequired: true }, {
	get() {
		check(this.urlParams, {
			roomId: String,
		});
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();

		const departments = Promise.await(findExternalMessages({
			roomId: this.urlParams.roomId,
			pagination: {
				offset,
				count,
				sort,
			},
		}));

		return API.v1.success(departments);
	},
});
