import {
	isGETLivechatInquiriesListParams,
	isPOSTLivechatInquiriesTakeParams,
	isGETLivechatInquiriesQueuedParams,
	isGETLivechatInquiriesQueuedForUserParams,
	isGETLivechatInquiriesGetOneParams,
} from '@rocket.chat/rest-typings';
import { Meteor } from 'meteor/meteor';
import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import { LivechatInquiry } from '@rocket.chat/models';

import { API } from '../../../../api/server';
import { Users, LivechatDepartment } from '../../../../models/server';
import { findInquiries, findOneInquiryByRoomId } from '../../../server/api/lib/inquiries';

API.v1.addRoute(
	'livechat/inquiries.list',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'], validateParams: isGETLivechatInquiriesListParams },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { department } = this.requestParams();
			const ourQuery: { status: string; department?: string } = { status: 'queued' };
			if (department) {
				const departmentFromDB = LivechatDepartment.findOneByIdOrName(department);
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
			if (this.bodyParams.userId && !Users.findOneById(this.bodyParams.userId, { fields: { _id: 1 } })) {
				return API.v1.failure('The user is invalid');
			}
			return API.v1.success({
				inquiry: Meteor.runAsUser(this.bodyParams.userId || this.userId, () =>
					Meteor.call('livechat:takeInquiry', this.bodyParams.inquiryId),
				),
			});
		},
	},
);

API.v1.addRoute(
	'livechat/inquiries.queued',
	{ authRequired: true, permissionsRequired: ['view-l-room'], validateParams: isGETLivechatInquiriesQueuedParams },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { department } = this.requestParams();

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
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { department } = this.requestParams();

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
