import { LivechatCustomField, LivechatVisitors } from '@rocket.chat/models';
import { isPOSTOmnichannelContactProps, isGETOmnichannelContactProps, isGETOmnichannelContactSearchProps } from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';

import { API } from '../../../../api/server';
import { Contacts } from '../../lib/Contacts';

API.v1.addRoute(
	'omnichannel/contact',
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
		validateParams: { POST: isPOSTOmnichannelContactProps, GET: isGETOmnichannelContactProps },
	},
	{
		async post() {
			const contact = await Contacts.registerContact(this.bodyParams);

			return API.v1.success({ contact });
		},
		async get() {
			const contact = await LivechatVisitors.findOneEnabledById(this.queryParams.contactId);

			return API.v1.success({ contact });
		},
	},
);

API.v1.addRoute(
	'omnichannel/contact.search',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETOmnichannelContactSearchProps },
	{
		async get() {
			const { email, phone, custom } = this.queryParams;

			let customCF: { [k: string]: string } = {};
			try {
				customCF = custom && JSON.parse(custom);
			} catch (e) {
				throw new Meteor.Error('error-invalid-params-custom');
			}

			const foundCF = await (async () => {
				if (!custom) {
					return {};
				}

				const cfIds = Object.keys(customCF);

				const customFields = await LivechatCustomField.findMatchingCustomFieldsByIds(cfIds, 'visitor', true, {
					projection: { _id: 1 },
				}).toArray();

				return Object.fromEntries(customFields.map(({ _id }) => [`livechatData.${_id}`, new RegExp(escapeRegExp(customCF[_id]), 'i')]));
			})();

			const contact = await LivechatVisitors.findOneByEmailAndPhoneAndCustomField(email, phone, foundCF);
			return API.v1.success({ contact });
		},
	},
);
