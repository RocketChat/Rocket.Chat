import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import { LivechatInquiry, LivechatDepartment, Users, LivechatRooms } from '@rocket.chat/models';
import {
	isGETLivechatInquiriesListParams,
	isPOSTLivechatInquiriesTakeParams,
	isGETLivechatInquiriesQueuedForUserParams,
	isGETLivechatInquiriesGetOneParams,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	isPOSTLivechatInquiriesReturnAsInquiry,
	POSTLivechatInquiriesReturnAsInquirySuccessResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import type { ExtractRoutesFromAPI } from '../../../../api/server/ApiClass';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { findInquiries, findOneInquiryByRoomId } from '../../../server/api/lib/inquiries';
import { returnRoomAsInquiry } from '../../../server/lib/rooms';
import { takeInquiry } from '../../../server/lib/takeInquiry';

API.v1.addRoute(
	'livechat/inquiries.list',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETLivechatInquiriesListParams },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { department } = this.queryParams;
			const ourQuery: { status: string; department?: string } = { status: 'queued' };
			if (department) {
				const departmentFromDB = await LivechatDepartment.findOneByIdOrName(department, { projection: { _id: 1 } });
				if (departmentFromDB) {
					ourQuery.department = departmentFromDB._id;
				}
			}
			// @ts-expect-error - attachments...
			const { cursor, totalCount } = LivechatInquiry.findPaginated(ourQuery, {
				sort: sort || { ts: -1 },
				skip: offset,
				limit: count,
				projection: {
					rid: 1,
					name: 1,
					ts: 1,
					status: 1,
					department: 1,
				},
			});

			const [inquiries, total] = await Promise.all([cursor.toArray(), totalCount]);

			return API.v1.success({
				inquiries,
				offset,
				count: inquiries.length,
				total,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/inquiries.take',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isPOSTLivechatInquiriesTakeParams },
	{
		async post() {
			if (this.bodyParams.userId && !(await Users.findOneById(this.bodyParams.userId, { projection: { _id: 1 } }))) {
				return API.v1.failure('The user is invalid');
			}
			return API.v1.success({
				inquiry: await takeInquiry(this.bodyParams.userId || this.userId, this.bodyParams.inquiryId),
			});
		},
	},
);

API.v1.addRoute(
	'livechat/inquiries.queuedForUser',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatInquiriesQueuedForUserParams },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = await this.parseJsonQuery();
			const { department } = this.queryParams;

			return API.v1.success(
				await findInquiries({
					userId: this.userId,
					department,
					status: LivechatInquiryStatus.QUEUED,
					pagination: {
						offset,
						count,
						sort,
					},
				}),
			);
		},
	},
);

API.v1.addRoute(
	'livechat/inquiries.getOne',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatInquiriesGetOneParams },
	{
		async get() {
			const { roomId } = this.queryParams;

			return API.v1.success(
				await findOneInquiryByRoomId({
					roomId,
				}),
			);
		},
	},
);

const livechatInquiriesEndpoints = API.v1.post(
	'livechat/inquiries.returnAsInquiry',
	{
		response: {
			200: POSTLivechatInquiriesReturnAsInquirySuccessResponse,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
		authRequired: true,
		permissionsRequired: ['view-l-room'],
		body: isPOSTLivechatInquiriesReturnAsInquiry,
	},
	async function action() {
		const { roomId, departmentId } = this.bodyParams;

		try {
			const room = await LivechatRooms.findOneById(roomId);
			if (!room) {
				return API.v1.failure('error-room-not-found');
			}

			const result = await returnRoomAsInquiry(room, departmentId);

			return API.v1.success({ result });
		} catch (error) {
			if (error instanceof Meteor.Error && typeof error.error === 'string') {
				return API.v1.failure(error.error as string);
			}

			return API.v1.failure('error-returning-inquiry');
		}
	},
);

type LivechatInquiriesEndpoints = ExtractRoutesFromAPI<typeof livechatInquiriesEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends LivechatInquiriesEndpoints {}
}
