import { LivechatContacts, LivechatCustomField, LivechatVisitors } from '@rocket.chat/models';
import {
	isPOSTOmnichannelContactsProps,
	isPOSTUpdateOmnichannelContactsProps,
	isGETOmnichannelContactsProps,
	isGETOmnichannelContactHistoryProps,
	isGETOmnichannelContactsChannelsProps,
	isGETOmnichannelContactsSearchProps,
	isGETOmnichannelContactsCheckExistenceProps,
} from '@rocket.chat/rest-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { removeEmpty } from '@rocket.chat/tools';
import { Match, check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { createContact } from '../../lib/contacts/createContact';
import { getContactChannelsGrouped } from '../../lib/contacts/getContactChannelsGrouped';
import { getContactHistory } from '../../lib/contacts/getContactHistory';
import { getContacts } from '../../lib/contacts/getContacts';
import { registerContact } from '../../lib/contacts/registerContact';
import { updateContact } from '../../lib/contacts/updateContact';

API.v1.addRoute(
	'omnichannel/contact',
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
	},
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

			const contact = await registerContact(this.bodyParams);

			return API.v1.success({ contact });
		},
		async get() {
			check(this.queryParams, {
				contactId: String,
			});

			const contact = await LivechatVisitors.findOneEnabledById(this.queryParams.contactId);

			return API.v1.success({ contact });
		},
	},
);

API.v1.addRoute(
	'omnichannel/contact.search',
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
	},
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

API.v1.addRoute(
	'omnichannel/contacts',
	{ authRequired: true, permissionsRequired: ['create-livechat-contact'], validateParams: isPOSTOmnichannelContactsProps },
	{
		async post() {
			const contactId = await createContact({ ...this.bodyParams, unknown: false });

			return API.v1.success({ contactId });
		},
	},
);

API.v1.addRoute(
	'omnichannel/contacts.update',
	{ authRequired: true, permissionsRequired: ['update-livechat-contact'], validateParams: isPOSTUpdateOmnichannelContactsProps },
	{
		async post() {
			const contact = await updateContact(removeEmpty(this.bodyParams));

			return API.v1.success({ contact });
		},
	},
);

API.v1.addRoute(
	'omnichannel/contacts.get',
	{ authRequired: true, permissionsRequired: ['view-livechat-contact'], validateParams: isGETOmnichannelContactsProps },
	{
		async get() {
			const { contactId } = this.queryParams;

			if (!contactId) {
				return API.v1.notFound();
			}

			const contact = await LivechatContacts.findOneById(contactId);

			if (!contact) {
				return API.v1.notFound();
			}

			return API.v1.success({ contact });
		},
	},
);

API.v1.addRoute(
	'omnichannel/contacts.search',
	{ authRequired: true, permissionsRequired: ['view-livechat-contact'], validateParams: isGETOmnichannelContactsSearchProps },
	{
		async get() {
			const query = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const result = await getContacts({ ...query, offset, count, sort });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'omnichannel/contacts.checkExistence',
	{ authRequired: true, permissionsRequired: ['view-livechat-contact'], validateParams: isGETOmnichannelContactsCheckExistenceProps },
	{
		async get() {
			const { contactId, email, phone } = this.queryParams;

			const contact = await LivechatContacts.countByContactInfo({ contactId, email, phone });

			return API.v1.success({ exists: contact > 0 });
		},
	},
);

API.v1.addRoute(
	'omnichannel/contacts.history',
	{ authRequired: true, permissionsRequired: ['view-livechat-contact-history'], validateParams: isGETOmnichannelContactHistoryProps },
	{
		async get() {
			const { contactId, source } = this.queryParams;
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();

			const history = await getContactHistory({ contactId, source, count, offset, sort });

			return API.v1.success(history);
		},
	},
);

API.v1.addRoute(
	'omnichannel/contacts.channels',
	{ authRequired: true, permissionsRequired: ['view-livechat-contact'], validateParams: isGETOmnichannelContactsChannelsProps },
	{
		async get() {
			const { contactId } = this.queryParams;

			const channels = await getContactChannelsGrouped(contactId);

			return API.v1.success({ channels });
		},
	},
);
