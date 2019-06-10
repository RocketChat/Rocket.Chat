import { Meteor } from 'meteor/meteor';

import { API } from '../../../../api';
import { hasPermission } from '../../../../authorization';
import { Users } from '../../../../models';
import { LivechatInquiry } from '../../../lib/LivechatInquiry';

API.v1.addRoute('livechat/inquiries', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();
		const cursor = LivechatInquiry.find({ status: 'open' }, {
			sort: sort || { ts: -1 },
			skip: offset,
			limit: count,
		});
		const totalCount = cursor.count();
		const inquiries = cursor.fetch();


		return API.v1.success({
			inquiries,
			offset,
			count: inquiries.length,
			total: totalCount,
		});
	},
});

API.v1.addRoute('livechat/inquiry.take', { authRequired: true }, {
	post() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}
		const { inquiryId, userId } = this.bodyParams;
		if (!inquiryId) {
			return API.v1.failure('The bodyParam "inquiryId" is required');
		}
		if (userId && !Users.findOneById(userId, { fields: { _id: 1 } })) {
			return API.v1.failure('The user is invalid');
		}
		return API.v1.success({
			inquiry: Meteor.runAsUser(userId || this.userId, () => Meteor.call('livechat:takeInquiry', inquiryId)),
		});
	},
});
