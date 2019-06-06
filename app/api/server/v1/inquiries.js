import { Meteor } from 'meteor/meteor';

import { API } from '../api';

API.v1.addRoute('inquiries.get', { authRequired: true }, {
	get() {
		const { department } = this.queryParams;

		let inquiries;
		Meteor.runAsUser(this.userId, () => {
			inquiries = Meteor.call('livechat:getOpenInquiries', department);
		});

		return API.v1.success({ inquiries });
	},
});

API.v1.addRoute('inquiries.take', { authRequired: true }, {
	post() {
		const { inquiryId } = this.bodyParams;

		if (!inquiryId) {
			return API.v1.failure('The "inquiryId" body parameter must be provided.');
		}

		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('livechat:takeInquiry', inquiryId);
		});

		if (!result) {
			return API.v1.failure();
		}

		return API.v1.success({ result });
	},
});
