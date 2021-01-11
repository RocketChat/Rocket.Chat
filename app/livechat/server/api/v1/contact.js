import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { Contacts } from '../../lib/Contacts';
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
				customFields: Match.Maybe(Object),
				contactManager: Match.Maybe(Object),
			});

			const contact = Contacts.registerContact(this.bodyParams, this.userId);

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
