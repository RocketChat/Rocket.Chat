import { check } from 'meteor/check';

import { API } from '../../../../api';
import { findVisitedPages } from '../../../server/api/lib/visitors';

API.v1.addRoute('livechat/visitors.pagesVisited', { authRequired: true }, {
	get() {
		check(this.queryParams, {
			roomId: String,
		});

		const pages = Promise.await(findVisitedPages({ userId: this.userId, roomId: this.queryParams.roomId }));

		return API.v1.success(pages);
	},
});
