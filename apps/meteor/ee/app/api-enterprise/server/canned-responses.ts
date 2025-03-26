import type { ILivechatDepartment, IOmnichannelCannedResponse, IUser } from '@rocket.chat/core-typings';
import { isPOSTCannedResponsesProps, isDELETECannedResponsesProps, isCannedResponsesProps } from '@rocket.chat/rest-typings';
import type { PaginatedResult, PaginatedRequest } from '@rocket.chat/rest-typings';

import { findAllCannedResponses, findAllCannedResponsesFilter, findOneCannedResponse } from './lib/canned-responses';
import { API } from '../../../../app/api/server';
import { getPaginationItems } from '../../../../app/api/server/helpers/getPaginationItems';
import { removeCannedResponse } from '../../canned-responses/server/methods/removeCannedResponse';
import { saveCannedResponse } from '../../canned-responses/server/methods/saveCannedResponse';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/canned-responses': {
			GET: (
				params: PaginatedRequest<{
					shortcut?: string;
					text?: string;
					scope?: string;
					createdBy?: IUser['username'];
					tags?: any;
					departmentId?: ILivechatDepartment['_id'];
				}>,
			) => PaginatedResult<{
				cannedResponses: IOmnichannelCannedResponse[];
			}>;
			POST: (params: {
				_id?: IOmnichannelCannedResponse['_id'];
				shortcut: string;
				text: string;
				scope: string;
				tags?: any;
				departmentId?: ILivechatDepartment['_id'];
			}) => void;
			DELETE: (params: { _id: IOmnichannelCannedResponse['_id'] }) => void;
		};
		'/v1/canned-responses/:_id': {
			GET: () => {
				cannedResponse: IOmnichannelCannedResponse;
			};
		};
	}
}

API.v1.addRoute(
	'canned-responses.get',
	{ authRequired: true, permissionsRequired: ['view-canned-responses'], license: ['canned-responses'] },
	{
		async get() {
			return API.v1.success({
				responses: await findAllCannedResponses({ userId: this.userId }),
			});
		},
	},
);

API.v1.addRoute(
	'canned-responses',
	{
		authRequired: true,
		permissionsRequired: { GET: ['view-canned-responses'], POST: ['save-canned-responses'], DELETE: ['remove-canned-responses'] },
		validateParams: { POST: isPOSTCannedResponsesProps, DELETE: isDELETECannedResponsesProps, GET: isCannedResponsesProps },
		license: ['canned-responses'],
	},
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort, fields } = await this.parseJsonQuery();
			const { shortcut, text, scope, tags, departmentId, createdBy } = this.queryParams;
			const { cannedResponses, total } = await findAllCannedResponsesFilter({
				shortcut,
				text,
				scope,
				tags,
				departmentId,
				userId: this.userId,
				createdBy,
				options: {
					sort,
					offset,
					count,
					fields,
				},
			});
			return API.v1.success({
				cannedResponses,
				count: cannedResponses.length,
				offset,
				total,
			});
		},
		async post() {
			const { _id, shortcut, text, scope, departmentId, tags } = this.bodyParams;
			await saveCannedResponse(
				this.userId,
				{
					shortcut,
					text,
					scope,
					...(tags && { tags }),
					...(departmentId && { departmentId }),
				},
				_id,
			);
			return API.v1.success();
		},
		async delete() {
			const { _id } = this.bodyParams;
			await removeCannedResponse(this.userId, _id);
			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'canned-responses/:_id',
	{ authRequired: true, permissionsRequired: ['view-canned-responses'], license: ['canned-responses'] },
	{
		async get() {
			const { _id } = this.urlParams;
			const cannedResponse = await findOneCannedResponse({
				userId: this.userId,
				_id,
			});

			if (!cannedResponse) {
				return API.v1.notFound();
			}

			return API.v1.success({ cannedResponse });
		},
	},
);
