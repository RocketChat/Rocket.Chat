import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import { LivechatInquiry, LivechatDepartment, Users } from '@rocket.chat/models';
import {
	isGETLivechatInquiriesListParams,
	isPOSTLivechatInquiriesTakeParams,
	isGETLivechatInquiriesQueuedParams,
	isGETLivechatInquiriesQueuedForUserParams,
	isGETLivechatInquiriesGetOneParams,
} from '@rocket.chat/rest-typings';

import { API } from '../../../../api/server';
import { getPaginationItems } from '../../../../api/server/helpers/getPaginationItems';
import { findInquiries, findOneInquiryByRoomId } from '../../../server/api/lib/inquiries';
import { takeInquiry } from '../../../server/methods/takeInquiry';

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
	'livechat/inquiries.queued',
	{
		authRequired: true,
		permissionsRequired: ['view-l-room'],
		validateParams: isGETLivechatInquiriesQueuedParams,
		deprecationVersion: '7.0.0',
	},
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
