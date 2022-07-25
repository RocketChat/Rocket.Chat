import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { LivechatCustomField, LivechatVisitors } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { Contacts } from '../../lib/Contacts';

API.v1.addRoute(
	'omnichannel/contact',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, {
				_id: Match.Maybe(String),
				token: String,
				name: String,
				email: Match.Maybe(String),
				phone: Match.Maybe(String),
				username: Match.Maybe(String),
				customFields: Match.Maybe(Object),
				contactManager: Match.Maybe({
					username: String,
				}),
			});

			const contact = await Contacts.registerContact(this.bodyParams);

			return API.v1.success({ contact });
		},
		async get() {
			check(this.queryParams, {
				contactId: String,
			});

			const contact = await LivechatVisitors.findOneById(this.queryParams.contactId);

			return API.v1.success({ contact });
		},
	},
);

API.v1.addRoute(
	'omnichannel/contact.search',
	{ authRequired: true },
	{
		async get() {
			check(this.queryParams, {
				email: Match.Maybe(String),
				phone: Match.Maybe(String),
				custom: Match.Maybe(String),
			});
			const { email, phone, custom } = this.queryParams;

			if (!email && !phone && !custom) {
				throw new Meteor.Error('error-invalid-params');
			}
			let foundCF = {};
			if (custom) {
				const customObj = Object.fromEntries(
					Array.from(new URLSearchParams(custom)),
				);

				foundCF = Object.fromEntries(
					(
						await LivechatCustomField.find(
							{ scope: 'visitor', searchable: true, _id: { $in: Object.keys(customObj) } },
							{
								projection: {
									_id: 1,
								},
							},
						).toArray()
					).map(({ _id }) => [_id, customObj[_id]]),
				);
			}

			const query = Object.assign(
				{},
				{
					...(email && { visitorEmails: { address: email } }),
					...(phone && { phone: { phoneNumber: phone } }),
					...(custom && { livechatData: foundCF }),
				},
			);

			const contact = await LivechatVisitors.findOne(query);
			return API.v1.success({ contact });
		},
	},
);
