import { Meteor } from 'meteor/meteor';

import { API } from '../../../app/api/server/api';
import { isEnterprise } from '../../app/license/server';

API.v1.addRoute(
	'chat.getMessageReadReceipts',
	{ authRequired: true },
	{
		async get() {
			if (!isEnterprise()) {
				throw new Meteor.Error('error-action-not-allowed', 'This is an enterprise feature');
			}

			const { messageId } = this.queryParams;
			if (!messageId) {
				return API.v1.failure({
					error: "The required 'messageId' param is missing.",
				});
			}

			try {
				return API.v1.success({
					receipts: await Meteor.call('getReadReceipts', { messageId }),
				});
			} catch (error: any) {
				return API.v1.failure({
					error: error.message,
				});
			}
		},
	},
);
