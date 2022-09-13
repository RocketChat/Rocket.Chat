import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { LivechatCustomField, LivechatVisitors } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { API } from '../../../../api/server';
import { Contacts } from '../../lib/Contacts';

API.v1.addRoute(
	'omnichannel/contact',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
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
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			check(this.queryParams, {
				email: Match.Maybe(String),
				phone: Match.Maybe(String),
				custom: Match.Maybe(String),
			});
			const { email, phone, custom } = this.queryParams;

			let customCF: { [k: string]: string } = {};
			try {
				customCF = custom && JSON.parse(custom);
			} catch (e) {
				throw new Meteor.Error('error-invalid-params-custom');
			}

			if (!email && !phone && !Object.keys(customCF).length) {
				throw new Meteor.Error('error-invalid-params');
			}

			const foundCF = await (async () => {
				if (!custom) {
					return {};
				}

				const cfIds = Object.keys(customCF);

				const customFields = await LivechatCustomField.findMatchingCustomFieldsByIds(Object.keys(cfIds), 'visitor', true, {
					projection: { _id: 1 },
				}).toArray();

				return Object.fromEntries(customFields.map(({ _id }) => [`livechatData.${_id}`, new RegExp(escapeRegExp(customCF[_id]), 'i')]));
			})();

			const contact = await LivechatVisitors.findOneByEmailAndPhoneAndCustomField(email, phone, foundCF);
			return API.v1.success({ contact });
		},
	},
);
