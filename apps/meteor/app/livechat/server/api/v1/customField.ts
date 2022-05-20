import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { API } from '../../../../api/server';
import { findGuest } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';
import { findLivechatCustomFields, findCustomFieldById } from '../lib/customFields';

API.v1.addRoute('livechat/custom.field', {
	post() {
		check(this.bodyParams, {
			token: String,
			key: String,
			value: String,
			overwrite: Boolean,
		});

		const { token, key, value, overwrite } = this.bodyParams;

		const guest = findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		if (!Livechat.setCustomFields({ token, key, value, overwrite })) {
			return API.v1.failure();
		}

		return API.v1.success({ field: { key, value, overwrite } });
	},
});

API.v1.addRoute('livechat/custom.fields', {
	post() {
		check(this.bodyParams, {
			token: String,
			customFields: [
				Match.ObjectIncluding({
					key: String,
					value: String,
					overwrite: Boolean,
				}),
			],
		});

		const { token } = this.bodyParams;
		const guest = findGuest(token);
		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		const fields: {
			Key: string;
			value: string;
			overwrite: boolean;
		}[] = [];

		for (const customField of this.bodyParams.customFields) {
			const data = Object.assign({ token }, customField);
			if (!Livechat.setCustomFields(data)) {
				return API.v1.failure();
			}

			fields.push({ Key: customField.key, value: customField.value, overwrite: customField.overwrite });
		}

		return API.v1.success({ fields });
	},
});

API.v1.addRoute(
	'livechat/custom-fields',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { text } = this.queryParams;

			const result = await findLivechatCustomFields({
				userId: this.userId,
				text,
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'livechat/custom-fields/:_id',
	{ authRequired: true },
	{
		async get() {
			check(this.urlParams, {
				_id: String,
			});
			const { customField } = await findCustomFieldById({ userId: this.userId, customFieldId: this.urlParams._id });
			if (!customField) {
				return API.v1.notFound(`No custom field found with id ${this.urlParams._id}`);
			}

			return API.v1.success({
				customField,
			});
		},
	},
);
