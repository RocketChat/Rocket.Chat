import { Promise } from 'meteor/promise';

import { API } from '../../../../../app/api/server';
import { findBusinessHours } from '../business-hour/lib/business-hour';

// @ts-ignore
API.v1.addRoute('livechat/business-hours.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();
		const { name } = this.queryParams;

		// @ts-ignore
		return API.v1.success(Promise.await(findBusinessHours(
			this.userId,
			{
				offset,
				count,
				sort,
			},
			name)));
	},
});
