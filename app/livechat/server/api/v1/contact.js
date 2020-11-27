import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { Contacts } from '../../lib/Contacts';


API.v1.addRoute('contact', { authRequired: true }, {
	post() {
		try {
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				name: String,
				email: Match.Maybe(String),
				phone: Match.Maybe(String),
			});

			const contactParams = this.bodyParams;
			if (this.bodyParams.phone) {
				contactParams.phone = { number: this.bodyParams.phone };
			}
			const contact = Contacts.saveContact(contactParams);

			return API.v1.success({ contact });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
	get() {
		check(this.queryParams, {
			contactId: String,
		});

		const contact = Promise.await(Contacts.findContactInfo(this.queryParams.contactId));

		return API.v1.success(contact);
	},
});
