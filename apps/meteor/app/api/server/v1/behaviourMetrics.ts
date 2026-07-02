import { Users, Messages } from '@rocket.chat/models';
import {
	ajv,
	isUsersBehaviourMetricsParamsGET,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { API } from '../api';

// Response schema for AJV validation
const behaviourMetricsResponseSchema = ajv.compile<{
	userId: string;
	windowDays: number;
	accountAgeDays: number;
	metrics: {
		messagesSent: number;
		messagesPerHour: number;
		distinctRoomsMessaged: number;
		dmRoomsMessaged: number;
		urlMessages: number;
		urlDensity: number;
	};
}>({
	type: 'object',
	properties: {
		userId: { type: 'string' },
		windowDays: { type: 'number' },
		accountAgeDays: { type: 'number' },
		metrics: {
			type: 'object',
			properties: {
				messagesSent: { type: 'number' },
				messagesPerHour: { type: 'number' },
				distinctRoomsMessaged: { type: 'number' },
				dmRoomsMessaged: { type: 'number' },
				urlMessages: { type: 'number' },
				urlDensity: { type: 'number' },
			},
			required: ['messagesSent', 'messagesPerHour', 'distinctRoomsMessaged', 'dmRoomsMessaged', 'urlMessages', 'urlDensity'],
			additionalProperties: false,
		},
		success: { type: 'boolean', enum: [true] },
	},
	required: ['userId', 'windowDays', 'accountAgeDays', 'metrics', 'success'],
	additionalProperties: false,
});

API.v1.get(
	'admin/users/behaviour-metrics',
	{
		authRequired: true,
		permissionsRequired: ['view-moderation-console'],
		query: isUsersBehaviourMetricsParamsGET,
		response: {
			200: behaviourMetricsResponseSchema,
			400: validateBadRequestErrorResponse,
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { userId, days = 7 } = this.queryParams;

		// 1. Validate user exists
		const user = await Users.findOneById(userId, { projection: { _id: 1, createdAt: 1 } });
		if (!user) {
			return API.v1.failure('error-invalid-user', 'User not found');
		}

		// 2. Calculate time window
		const windowMs = days * 24 * 60 * 60 * 1000;
		const windowStart = new Date(Date.now() - windowMs);
		const totalHours = days * 24;

		// 3. Aggregation pipeline on messages collection
		// Single aggregation to get: messagesSent, distinctRooms, dmRooms, urlMessages
		const pipeline = [
			{ $match: { 'u._id': userId, ts: { $gte: windowStart }, t: { $exists: false } } },
			{
				$lookup: {
					from: 'rocketchat_room',
					localField: 'rid',
					foreignField: '_id',
					as: 'room',
					pipeline: [{ $project: { t: 1 } }],
				},
			},
			{ $unwind: { path: '$room', preserveNullAndEmptyArrays: true } },
			{
				$group: {
					_id: null,
					messagesSent: { $sum: 1 },
					distinctRooms: { $addToSet: '$rid' },
					dmRooms: {
						$addToSet: {
							$cond: [{ $eq: ['$room.t', 'd'] }, '$rid', '$$REMOVE'],
						},
					},
					urlMessages: {
						$sum: {
							$cond: [{ $and: [{ $isArray: '$urls' }, { $gt: [{ $size: '$urls' }, 0] }] }, 1, 0],
						},
					},
				},
			},
		];

		const [result] = await Messages.col.aggregate(pipeline).toArray();

		const messagesSent = result?.messagesSent ?? 0;
		const distinctRoomsMessaged = result?.distinctRooms?.length ?? 0;
		const dmRoomsMessaged = result?.dmRooms?.length ?? 0;
		const urlMessages = result?.urlMessages ?? 0;

		// 4. Build response
		const accountAgeDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

		return API.v1.success({
			userId,
			windowDays: days,
			accountAgeDays,
			metrics: {
				messagesSent,
				messagesPerHour: totalHours > 0 ? parseFloat((messagesSent / totalHours).toFixed(2)) : 0,
				distinctRoomsMessaged,
				dmRoomsMessaged,
				urlMessages,
				urlDensity: messagesSent > 0 ? parseFloat((urlMessages / messagesSent).toFixed(2)) : 0,
			},
		});
	},
);
