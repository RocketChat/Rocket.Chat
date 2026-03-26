import {
	isLivechatTagsListProps,
	GETLivechatTagsSuccessResponse,
	GETLivechatTagByIdSuccessResponse,
	isPOSTLivechatTagsSaveParams,
	POSTLivechatTagsSaveSuccessResponse,
	isPOSTLivechatTagsDeleteParams,
	POSTLivechatTagsDeleteSuccessResponse,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
	validateNotFoundErrorResponse,
} from '@rocket.chat/rest-typings';

import { findTags, findTagById } from './lib/tags';
import { API } from '../../../../../app/api/server';
import type { ExtractRoutesFromAPI } from '../../../../../app/api/server/ApiClass';
import { getPaginationItems } from '../../../../../app/api/server/helpers/getPaginationItems';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

const livechatTagsEndpoints = API.v1
	.get(
		'livechat/tags',
		{
			authRequired: true,
			permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } },
			license: ['livechat-enterprise'],
			query: isLivechatTagsListProps,
			response: {
				200: GETLivechatTagsSuccessResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
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
	)
	.get(
		'livechat/tags/:tagId',
		{
			authRequired: true,
			permissionsRequired: { GET: { permissions: ['view-l-room', 'manage-livechat-tags'], operation: 'hasAny' } },
			license: ['livechat-enterprise'],
			response: {
				200: GETLivechatTagByIdSuccessResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
				404: validateNotFoundErrorResponse,
			},
		},
		async function action() {
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
	)
	.post(
		'livechat/tags.save',
		{
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
