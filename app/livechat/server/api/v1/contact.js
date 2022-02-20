import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { API } from '../../../../api/server';
import { Contacts } from '../../lib/Contacts';
import { LivechatVisitors } from '../../../../models';

API.v1.addRoute(
	'omnichannel/contact',
	{ authRequired: true },
	{
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

				const contact = Contacts.registerContact(this.bodyParams);

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
	},
);

API.v1.addRoute(
	'omnichannel/contact.search',
	{ authRequired: true },
	{
		get() {
			try {
				check(this.queryParams, {
					email: Match.Maybe(String),
					phone: Match.Maybe(String),
				});

				const { email, phone } = this.queryParams;

				if (!email && !phone) {
					throw new Meteor.Error('error-invalid-params');
				}

				const query = Object.assign(
					{},
					{
						...(email && { visitorEmails: { address: email } }),
						...(phone && { phone: { phoneNumber: phone } }),
					},
				);

				const contact = Promise.await(LivechatVisitors.findOne(query));
				return API.v1.success({ contact });
			} catch (e) {
				return API.v1.failure(e);
			}
		},
	},
);
