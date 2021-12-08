import { Uploads } from '../../../models/server';
import { Messages, Rooms } from '../../../models/server/raw';

const getDirectRoomsStatistics = (dateFrom, dateTo) => {
	const params = [
		{
			$match: {
				ts: {
					$gte: dateFrom,
					$lte: dateTo,
				},
				t: 'd',
			},
		},
		{
			$lookup: {
				from: 'users',
				let: {
					uid: { $arrayElemAt: ['$uids', 0] },
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: [
									'$_id',
									'$$uid',
								],
							},
						},
					},
					{
						$project: {
							_id: 0,
							groupId: '$customFields.groupId',
							store: '$customFields.store',
						},
					},
				],
				as: 'user',
			},
		},
		{
			$unwind: {
				path: '$user',
			},
		},
		{
			$group: {
				_id: {
					groupId: '$user.groupId',
					store: '$user.store',
				},
				count: {
					$sum: 1,
				},
			},
		},
		{
			$project: {
				_id: 0,
				groupId: '$_id.groupId',
				store: '$_id.store',
				count: 1,
			},
		},
	];

	return Promise.await(Rooms.col.aggregate(params).toArray());
};

const getChannelsStatistics = (dateFrom, dateTo) => {
	const params = [
		{
			$match: {
				ts: {
					$gte: dateFrom,
					$lte: dateTo,
				},
				t: 'c',
			},
		},
		{
			$lookup: {
				from: 'users',
				let: {
					uid: '$u._id',
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: [
									'$_id',
									'$$uid',
								],
							},
						},
					},
					{
						$project: {
							_id: 0,
							groupId: '$customFields.groupId',
							store: '$customFields.store',
						},
					},
				],
				as: 'user',
			},
		},
		{
			$unwind: {
				path: '$user',
			},
		},
		{
			$group: {
				_id: {
					groupId: '$user.groupId',
					store: '$user.store',
				},
				count: {
					$sum: 1,
				},
			},
		},
		{
			$project: {
				_id: 0,
				groupId: '$_id.groupId',
				store: '$_id.store',
				count: 1,
			},
		},
	];

	return Promise.await(Rooms.col.aggregate(params).toArray());
};

const getPrivateGroupsStatistics = (dateFrom, dateTo) => {
	const params = [
		{
			$match: {
				ts: {
					$gte: dateFrom,
					$lte: dateTo,
				},
				t: 'p',
			},
		},
		{
			$lookup: {
				from: 'users',
				let: {
					uid: '$u._id',
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: [
									'$_id',
									'$$uid',
								],
							},
						},
					},
					{
						$project: {
							_id: 0,
							groupId: '$customFields.groupId',
							store: '$customFields.store',
						},
					},
				],
				as: 'user',
			},
		},
		{
			$unwind: {
				path: '$user',
			},
		},
		{
			$group: {
				_id: {
					groupId: '$groupId',
					store: '$user.store',
				},
				count: {
					$sum: 1,
				},
			},
		},
		{
			$project: {
				_id: 0,
				groupId: '$_id.groupId',
				store: '$_id.store',
				count: 1,
			},
		},
	];

	return Promise.await(Rooms.col.aggregate(params).toArray());
};

const getMessagesStatistics = (dateFrom, dateTo) => {
	const params = [
		{
			$match: {
				ts: {
					$gte: dateFrom,
					$lte: dateTo,
				},
			},
		},
		{
			$lookup: {
				from: 'users',
				let: {
					uid: '$u._id',
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: [
									'$_id',
									'$$uid',
								],
							},
						},
					},
					{
						$project: {
							_id: 0,
							groupId: '$customFields.groupId',
							store: '$customFields.store',
						},
					},
				],
				as: 'user',
			},
		},
		{
			$unwind: {
				path: '$user',
			},
		},
		{
			$group: {
				_id: {
					groupId: '$user.groupId',
					store: '$user.store',
				},
				count: {
					$sum: 1,
				},
			},
		},
		{
			$project: {
				_id: 0,
				groupId: '$_id.groupId',
				store: '$_id.store',
				count: 1,
			},
		},
	];

	return Promise.await(Messages.col.aggregate(params).toArray());
};

const getUploadsStatistics = (dateFrom, dateTo) => {
	const params = [
		{
			$match: {
				uploadedAt: {
					$gte: dateFrom,
					$lte: dateTo,
				},
			},
		},
		{
			$lookup: {
				from: 'users',
				let: {
					userId: '$userId',
				},
				pipeline: [
					{
						$match: {
							$expr: {
								$eq: [
									'$_id',
									'$$userId',
								],
							},
						},
					},
					{
						$project: {
							_id: 0,
							groupId: '$customFields.groupId',
							store: '$customFields.store',
						},
					},
				],
				as: 'user',
			},
		},
		{
			$unwind: {
				path: '$user',
			},
		},
		{
			$group: {
				_id: {
					groupId: '$user.groupId',
					store: '$user.store',
				},
				count: {
					$sum: 1,
				},
				size: {
					$sum: '$size',
				},
			},
		},
		{
			$project: {
				_id: 0,
				groupId: '$_id.groupId',
				store: '$_id.store',
				count: 1,
				size: 1,
			},
		},
	];

	return Promise.await(Uploads.model.rawCollection().aggregate(params).toArray());
};

export const statisticsByGroups = {
	get: function _getStatistics(dateFrom, dateTo) {
		const statistics = {};

		statistics.privateGroups = getPrivateGroupsStatistics(dateFrom, dateTo);
		statistics.channels = getChannelsStatistics(dateFrom, dateTo);
		statistics.directMessageRooms = getDirectRoomsStatistics(dateFrom, dateTo);
		statistics.messages = getMessagesStatistics(dateFrom, dateTo);
		statistics.uploads = getUploadsStatistics(dateFrom, dateTo);
		return statistics;
	},
};
