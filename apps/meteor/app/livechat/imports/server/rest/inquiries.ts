import { Meteor } from 'meteor/meteor';
import { ILivechatInquiryRecord, LivechatInquiryStatus } from '@rocket.chat/core-typings';

import { Users, LivechatInquiry } from '../../../../models/server/raw/index';
import LivechatDepartment from '../../../../models/server/models/LivechatDepartment';
import { API } from '../../../../api/server';
import { findInquiries, findOneInquiryByRoomId } from '../../../server/api/lib/inquiries';

API.v1.addRoute(
	'livechat/inquiries.list',
	{ authRequired: true, permissionsRequired: ['view-livechat-manager'] },
	{
		async get() {
			const { offset, count } = this.getPaginationItems();
			const { sort } = this.parseJsonQuery();
			const { department } = this.requestParams();
			const ourQuery: Partial<ILivechatInquiryRecord> = { status: LivechatInquiryStatus.QUEUED };

			if (department) {
				const departmentFromDB = LivechatDepartment.findOneByIdOrName(department);
				if (departmentFromDB) {
					ourQuery.department = departmentFromDB._id;
				}
			}
			const cursor = LivechatInquiry.find(ourQuery, {
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
			const totalCount = await cursor.count();
			const inquiries = await cursor.toArray();

			return API.v1.success({
				inquiries,
				offset,
				count: inquiries.length,
				total: totalCount,
			});
		},
	},
);

API.v1.addRoute(
	'livechat/inquiries.take',
	{ authRequired: true },
	{
		async post() {
			if (this.bodyParams.userId && !(await Users.findOneById(this.bodyParams.userId, { fields: { _id: 1 } }))) {
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
	{ authRequired: true },
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
	{ authRequired: true },
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
	{ authRequired: true },
	{
		async get() {
			const { roomId } = this.queryParams;
			if (!roomId) {
				return API.v1.failure("The 'roomId' param is required");
			}

			return API.v1.success(
				await findOneInquiryByRoomId({
					userId: this.userId,
					roomId,
				}),
			);
		},
	},
);
