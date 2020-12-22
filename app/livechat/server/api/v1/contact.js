import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';
import {
	LivechatVisitors,
} from '../../../../models';

API.v1.addRoute('omnichannel/contact', { authRequired: true }, {
	post() {
		try {
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				token: String,
				name: String,
				email: Match.Maybe(String),
				phone: Match.Maybe(String),
				livechatData: Match.Maybe(Object),
				contactManager: Match.Maybe(Object),
			});

			const contactParams = this.bodyParams;
			if (this.bodyParams.phone) {
				contactParams.phone = { number: this.bodyParams.phone };
			}
			const contact = Livechat.registerGuest(contactParams);

			return API.v1.success({ contact });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
	get() {
		check(this.queryParams, {
			contactId: String,
		});

		const contact = Promise.await(LivechatVisitors.findOneById(this.queryParams.contactId));

		return API.v1.success({ contact });
	},
});
