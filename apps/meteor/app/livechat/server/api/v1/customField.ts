import { LivechatCustomField } from '@rocket.chat/models';
import {
	isLivechatCustomFieldsProps,
	isPOSTLivechatCustomFieldParams,
	isPOSTLivechatCustomFieldsParams,
	isPOSTLivechatRemoveCustomFields,
	POSTLivechatRemoveCustomFieldSuccess,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import type { ExtractRoutesFromAPI } from '../../../../api/server/ApiClass';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { setCustomFields, setMultipleCustomFields } from '../../lib/custom-fields';
import { findLivechatCustomFields, findCustomFieldById } from '../lib/customFields';
import { findGuest } from '../lib/livechat';

API.v1.addRoute(
	'livechat/custom.field',
	{ validateParams: isPOSTLivechatCustomFieldParams },
	{
		async post() {
			const { token, key, value, overwrite } = this.bodyParams;
			const guest = await findGuest(token);
			if (!guest) {
				throw new Error('invalid-token');
			}

			await setCustomFields({ token, key, value, overwrite });

			return API.v1.success({ field: { key, value, overwrite } });
		},
	},
);

API.v1.addRoute(
	'livechat/custom.fields',
	{ validateParams: isPOSTLivechatCustomFieldsParams },
	{
		async post() {
			const { token } = this.bodyParams;
			const visitor = await findGuest(token);
			if (!visitor) {
				throw new Error('invalid-token');
			}

			const result = await setMultipleCustomFields({ visitor, customFields: this.bodyParams.customFields });

			return API.v1.success({
				fields: result.map(({ key, value, overwrite }) => ({ Key: key, value, overwrite })),
			});
		},
	},
);

API.v1.addRoute(
	'livechat/custom-fields',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isLivechatCustomFieldsProps },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { text } = this.queryParams;

			const customFields = await findLivechatCustomFields({
				text,
				pagination: {
					offset,
					count,
					sort,
				},
			});

			return API.v1.success(customFields);
		},
	},
);

API.v1.addRoute(
	'livechat/custom-fields/:_id',
	{ authRequired: true, permissionsRequired: ['view-l-room'] },
	{
		async get() {
			const { customField } = await findCustomFieldById({ customFieldId: this.urlParams._id });

			return API.v1.success({
				customField,
			});
		},
	},
);

const livechatCustomFieldsEndpoints = API.v1.post(
	'livechat/custom-fields.remove',
	{
		response: {
			200: POSTLivechatRemoveCustomFieldSuccess,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
		},
		authRequired: true,
		permissionsRequired: ['view-livechat-manager'], // is this permission appropriate for the targeted action?
		body: isPOSTLivechatRemoveCustomFields,
	},
	async function action() {
		const { _id } = this.bodyParams;

		const customField = await LivechatCustomField.findOneById(_id, { projection: { _id: 1 } });
		if (!customField) {
			return API.v1.failure('custom-field-not-found');
		}

		const result = await LivechatCustomField.removeById(_id);

		return API.v1.success({ ...result });
	},
);

type LivechatCustomFieldsEndpoints = ExtractRoutesFromAPI<typeof livechatCustomFieldsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatCustomFieldsEndpoints {}
}
