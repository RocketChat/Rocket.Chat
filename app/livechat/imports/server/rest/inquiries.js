import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../../../../api';
import { hasPermission } from '../../../../authorization';
import { LivechatInquiry } from '../../../lib/LivechatInquiry';

API.v1.addRoute('livechat/inquiries', { authRequired: true }, {
	get() {
		const { department } = this.queryParams;

		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		let inquiries;
		if (department) {
			inquiries = LivechatInquiry.find({ department, status: 'open', t: 'l' });
		} else {
			inquiries = LivechatInquiry.find({ status: 'open', t: 'l' });
		}

		return API.v1.success({
			inquiries: inquiries.map((inquiry) => inquiry),
		});
	},
});

API.v1.addRoute('livechat/inquiry', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-livechat-manager')) {
			return API.v1.unauthorized();
		}

		try {
			check(this.queryParams, {
				_id: Match.Maybe(String),
			});

			let result;
			Meteor.runAsUser(this.userId, () => {
				result = Meteor.call('livechat:takeInquiry', this.queryParams._id);
			});

			if (result) {
				return API.v1.success({ result });
			}

			return API.v1.failure();
		} catch (e) {
			return API.v1.failure(e.error);
		}
	},
});
