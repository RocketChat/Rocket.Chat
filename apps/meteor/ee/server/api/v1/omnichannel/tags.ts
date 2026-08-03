import {
	isPOSTLivechatTagsSaveParams,
	POSTLivechatTagsSaveSuccessResponse,
	isPOSTLivechatTagsDeleteParams,
	POSTLivechatTagsDeleteSuccessResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { findTags, findTagById } from './lib/tags';
import { tagsExamples } from './tags.examples';
import { API } from '../../../../../server/api';
import type { ExtractRoutesFromAPI } from '../../../../../server/api/ApiClass';
import { getPaginationItems } from '../../../../../server/api/lib/getPaginationItems';
import { LivechatEnterprise } from '../../../lib/omnichannel/LivechatEnterprise';

API.v1.addRoute(
	'livechat/tags',
	{
		authRequired: true,
		permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } },
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { text, viewAll, department } = this.queryParams;

			return API.v1.success(
				await findTags({
					userId: this.userId,
					text,
					department,
					viewAll: viewAll === 'true',
					pagination: {
						offset,
						count,
						sort: typeof sort === 'string' ? JSON.parse(sort || '{}') : sort,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/tags/:tagId',
	{
		authRequired: true,
		permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } },
		license: ['livechat-enterprise'],
	},
	{
		async get() {
			const { tagId } = this.urlParams;

			const tag = await findTagById({
				userId: this.userId,
				tagId,
			});

			if (!tag) {
				return API.v1.notFound('Tag not found');
			}

			return API.v1.success(tag);
		},
	},
);

const livechatTagsEndpoints = API.v1
	.post(
		'livechat/tags.save',
		{
			summary: 'Create a Tag',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Enterprise%20tag.svg" alt="Enterprise" style="display: block; margin: auto"></div>

Use this endpoint to create an Omnichannel tag. Permission required: \`manage-livechat-tags\``,
			examples: tagsExamples['livechat/tags.save'],
			response: {
				200: POSTLivechatTagsSaveSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissions: ['manage-livechat-tags'],
			license: ['livechat-enterprise'],
			body: isPOSTLivechatTagsSaveParams,
		},
		async function action() {
			const { _id, tagData, tagDepartments } = this.bodyParams;

			const result = await LivechatEnterprise.saveTag(_id, tagData, tagDepartments);

			return API.v1.success(result);
		},
	)
	.post(
		'livechat/tags.delete',
		{
			summary: 'Delete a tag',
			description: `<div style="text-align: center; margin: 1rem 0 1rem 0;"><img src="https://raw.githubusercontent.com/RocketChat/Rocket.Chat-Open-API/main/images/Enterprise%20tag.svg" alt="Enterprise" style="display: block; margin: auto;"></div>

This endpoint is used to delete an Omnichannel tag from the workspace. Permission required: \`manage-livechat-tags\`

### Changelog
| Version      | Description |
| ------------ | ------------|
|7.12.0         | Added       |`,
			examples: tagsExamples['livechat/tags.delete'],
			response: {
				200: POSTLivechatTagsDeleteSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
			authRequired: true,
			permissions: ['manage-livechat-tags'],
			license: ['livechat-enterprise'],
			body: isPOSTLivechatTagsDeleteParams,
		},
		async function action() {
			const { id } = this.bodyParams;

			await LivechatEnterprise.removeTag(id);

			return API.v1.success();
		},
	);

type LivechatTagsEndpoints = ExtractRoutesFromAPI<typeof livechatTagsEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatTagsEndpoints {}
}
