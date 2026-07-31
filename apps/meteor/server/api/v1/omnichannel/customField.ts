import { LivechatCustomField } from '@rocket.chat/models';
import {
	isLivechatCustomFieldsProps,
	isPOSTLivechatCustomFieldParams,
	isPOSTLivechatCustomFieldsParams,
	isPOSTLivechatRemoveCustomFields,
	isPOSTLivechatSaveCustomFieldsParams,
	POSTLivechatRemoveCustomFieldSuccess,
	POSTLivechatSaveCustomFieldSuccess,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../..';
import { setCustomFields, setMultipleCustomFields } from '../../../lib/omnichannel/custom-fields';
import type { ExtractRoutesFromAPI } from '../../ApiClass';
import { customFieldExamples } from './customField.examples';
import { findLivechatCustomFields, findCustomFieldById } from './lib/customFields';
import { findGuest } from './lib/livechat';
import { getPaginationItems } from '../../lib/getPaginationItems';

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

const livechatCustomFieldsEndpoints = API.v1
	.post(
		'livechat/custom-fields.save',
		{
			summary: 'Create Omnichannel Custom Field',
			description: `Create a new Omnichannel custom field or update an existing custom field. You can refer to the <a href='https://docs.rocket.chat/docs/omnichannel-custom-fields' target='_blank'>Omnichannel Custom Fields</a> user guide for details.

Permission required: \`view-livechat-manager\`

### Changelog
| Version      | Description |
| ---------------- | ------------|
|7.11.0            | Added       |`,
			examples: customFieldExamples['livechat/custom-fields.save'],
			tags: ['Omnichannel Custom Fields'],
			response: {
				200: POSTLivechatSaveCustomFieldSuccess,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'], // is this permission appropriate for the targeted action?
			body: isPOSTLivechatSaveCustomFieldsParams,
		},
		async function action() {
			const { customFieldId, customFieldData } = this.bodyParams;

			if (customFieldId) {
				const customField = await LivechatCustomField.findOneById(customFieldId);
				if (!customField) {
					return API.v1.failure('Custom Field Not found');
				}
			}

			if (!customFieldId) {
				const customField = await LivechatCustomField.findOneById(customFieldData.field);
				if (customField) {
					return API.v1.failure('Custom Field already exists');
				}
			}

			const { field, label, scope, visibility, ...extraData } = customFieldData;
			const result = await LivechatCustomField.createOrUpdateCustomField(customFieldId, field, label, scope, visibility, {
				...extraData,
			});

			return API.v1.success({ customField: result });
		},
	)
	.post(
		'livechat/custom-fields.delete',
		{
			summary: 'Delete Omnichannel Custom Field',
			description: `Delete an Omnichannel custom field entry. Permission required: \`view-livechat-manager\`. (On the workspace UI, go to **Manage** > **Workspace** > **Permissions**. Search for the \`View Omnichannel Manager\` permission. By default, livechat managers and agents have this permission.)

### Changelog
| Version      | Description |
| ---------------- | ------------|
|7.11.0            | Added       |`,
			examples: customFieldExamples['livechat/custom-fields.delete'],
			tags: ['Omnichannel Custom Fields'],
			response: {
				200: POSTLivechatRemoveCustomFieldSuccess,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissionsRequired: ['view-livechat-manager'], // is this permission appropriate for the targeted action?
			body: isPOSTLivechatRemoveCustomFields,
		},
		async function action() {
			const { customFieldId } = this.bodyParams;

			const result = await LivechatCustomField.removeById(customFieldId);
			if (result.deletedCount === 0) {
				return API.v1.failure('Custom field not found');
			}

			return API.v1.success();
		},
	);

type LivechatCustomFieldsEndpoints = ExtractRoutesFromAPI<typeof livechatCustomFieldsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatCustomFieldsEndpoints {}
}
