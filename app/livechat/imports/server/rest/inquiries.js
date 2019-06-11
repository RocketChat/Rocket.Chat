import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../../../../api';
import { hasPermission } from '../../../../authorization';
import { Users } from '../../../../models';
import { LivechatInquiry } from '../../../lib/LivechatInquiry';

API.v1.addRoute('livechat/inquiries.list', { authRequired: true }, {
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
			fields: {
				rid: 1,
				name: 1,
				ts: 1,
				status: 1,
			},
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

API.v1.addRoute('livechat/inquiries.take', { authRequired: true }, {
	post() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}
		try {
			check(this.bodyParams, {
				inquiryId: String,
				userId: Match.Maybe(String),
			});
			if (this.bodyParams.userId && !Users.findOneById(this.bodyParams.userId, { fields: { _id: 1 } })) {
				return API.v1.failure('The user is invalid');
			}
			return API.v1.success({
				inquiry: Meteor.runAsUser(this.bodyParams.userId || this.userId, () => Meteor.call('livechat:takeInquiry', this.bodyParams.inquiryId)),
			});
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
