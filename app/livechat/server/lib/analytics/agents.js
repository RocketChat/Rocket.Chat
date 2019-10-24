import moment from 'moment';

import { Users } from '../../../../models/server';

const findAllAverageServiceTimeAsync = async ({
	start,
	end,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const roomsFilter = [
		{ $gte: ['$$room.ts', new Date(start)] },
		{ $lte: ['$$room.ts', new Date(end)] },
	];
	const match = { $match: { roles: { $in: ['livechat-agent'] } } };
	const lookup = {
		$lookup: {
			from: 'rocketchat_room',
			localField: '_id',
			foreignField: 'servedBy._id',
			as: 'rooms',
		},
	};
	const projects = [
		{
			$project: {
				user: '$$ROOT',
				rooms: {
					$filter: {
						input: '$rooms',
						as: 'room',
						cond: {
							$and: roomsFilter,
						},
					},
				},
			},
		},
		{
			$project: {
				user: '$user',
				chats: { $size: '$rooms' },
				chatsDuration: { $sum: '$rooms.metrics.chatDuration' },
			},
		},
		{
			$project: {
				username: '$user.username',
				name: '$user.name',
				active: '$user.active',
				averageServiceTimeInSeconds: {
					$ceil: {
						$cond: [
							{ $eq: ['$chats', 0] },
							0,
							{ $divide: ['$chatsDuration', '$chats'] },
						],
					},
				},
			},
		}];
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { username: 1 } };
	return {
		agents: await Users.model.rawCollection().aggregate([match, lookup, ...projects, sort, skip, limit]).toArray(),
		total: (await Users.model.rawCollection().aggregate([match, lookup, ...projects]).toArray()).length,
	};
};

const findAllServiceTimeAsync = async ({
	start,
	end,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const roomsFilter = [
		{ $gte: ['$$room.ts', new Date(start)] },
		{ $lte: ['$$room.ts', new Date(end)] },
	];
	const match = { $match: { roles: { $in: ['livechat-agent'] } } };
	const lookup = {
		$lookup: {
			from: 'rocketchat_room',
			localField: '_id',
			foreignField: 'servedBy._id',
			as: 'rooms',
		},
	};
	const projects = [
		{
			$project: {
				user: '$$ROOT',
				rooms: {
					$filter: {
						input: '$rooms',
						as: 'room',
						cond: {
							$and: roomsFilter,
						},
					},
				},
			},
		},
		{
			$project: {
				username: '$user.username',
				name: '$user.name',
				active: '$user.active',
				chats: { $size: '$rooms' },
				chatsDuration: { $ceil: { $sum: '$rooms.metrics.chatDuration' } },
			},
		}];
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { username: 1 } };
	return {
		agents: await Users.model.rawCollection().aggregate([match, lookup, ...projects, sort, skip, limit]).toArray(),
		total: (await Users.model.rawCollection().aggregate([match, lookup, ...projects]).toArray()).length,
	};
};

const findAvailableServiceTimeHistoryAsync = async ({
	start,
	end,
	fullReport,
	options = {},
}) => {
	if (!start || !end) {
		throw new Error('"start" and "end" must be provided');
	}
	const sessionFilter = [
		{ $gte: ['$$session.date', parseInt(moment(start).format('YYYYMMDD'))] },
		{ $lte: ['$$session.date', parseInt(moment(end).format('YYYYMMDD'))] },
	];
	const match = { $match: { roles: { $in: ['livechat-agent'] } } };
	const lookup = {
		$lookup: {
			from: 'rocketchat_livechat_sessions',
			localField: '_id',
			foreignField: 'agentId',
			as: 'sessions',
		},
	};
	const sessionProject = {
		$project: {
			user: '$$ROOT',
			sessions: {
				$filter: {
					input: '$sessions',
					as: 'session',
					cond: {
						$and: sessionFilter,
					},
				},
			},
		},
	};
	const presentationProject = {
		$project: {
			username: '$user.username',
			name: '$user.name',
			active: '$user.active',
			availableTimeInSeconds: { $sum: '$sessions.availableTime' },
		},
	};
	if (fullReport) {
		presentationProject.$project['sessions.serviceHistory'] = 1;
	}
	const skip = { $skip: options.offset };
	const limit = { $limit: options.count };
	const sort = { $sort: { username: 1 } };
	return {
		agents: await Users.model.rawCollection().aggregate([match, lookup, sessionProject, presentationProject, sort, skip, limit]).toArray(),
		total: (await Users.model.rawCollection().aggregate([match, lookup, sessionProject, presentationProject]).toArray()).length,
	};
};

export const findAllAverageServiceTime = ({ start, end, options }) => Promise.await(findAllAverageServiceTimeAsync({ start, end, options }));
export const findAllServiceTime = ({ start, end, options }) => Promise.await(findAllServiceTimeAsync({ start, end, options }));
export const findAvailableServiceTimeHistory = ({ start, end, fullReport, options }) => Promise.await(findAvailableServiceTimeHistoryAsync({ start, end, fullReport, options }));
