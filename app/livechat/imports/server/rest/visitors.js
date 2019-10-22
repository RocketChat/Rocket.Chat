import { check } from 'meteor/check';

import { API } from '../../../../api';
import { findVisitorInfo } from '../../../server/api/lib/visitors';

API.v1.addRoute('livechat/visitors.info', { authRequired: true }, {
	get() {
		check(this.queryParams, {
			visitorId: String,
		});

		const visitor = Promise.await(findVisitorInfo({ userId: this.userId, visitorId: this.queryParams.visitorId }));

		return API.v1.success(visitor);
	},
});
