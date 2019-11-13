
import { check } from 'meteor/check';

import { API } from '../../../../api';
import { findVisitorInfo, findVisitedPages } from '../../../server/api/lib/visitors';

API.v1.addRoute('livechat/visitors.info', { authRequired: true }, {
	get() {
		check(this.queryParams, {
			visitorId: String,
		});

		const visitor = Promise.await(findVisitorInfo({ userId: this.userId, visitorId: this.queryParams.visitorId }));

		return API.v1.success(visitor);
	},
});

API.v1.addRoute('livechat/visitors.pagesVisited', { authRequired: true }, {
	get() {
		check(this.queryParams, {
			roomId: String,
		});

		const pages = Promise.await(findVisitedPages({ userId: this.userId, roomId: this.queryParams.roomId }));

		return API.v1.success(pages);
	},
});
