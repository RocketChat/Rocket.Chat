import {
	AggregationCursor,
	BulkWriteOperation,
	BulkWriteOpResultObject,
	Collection,
	UpdateWriteOpResult,
	FilterQuery,
	Cursor,
} from 'mongodb';
import type {
	ISession,
	UserSessionAggregation,
	DeviceSessionAggregation,
	OSSessionAggregation,
	UserSessionAggregationResult,
	DeviceSessionAggregationResult,
	OSSessionAggregationResult,
	IUser,
} from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification, ModelOptionalId } from './BaseRaw';

type DestructuredDate = { year: number; month: number; day: number };
type DestructuredDateWithType = {
	year: number;
	month: number;
	day: number;
	type?: 'month' | 'week';
};
type DestructuredRange = { start: DestructuredDate; end: DestructuredDate };
type DateRange = { start: Date; end: Date };

const matchBasedOnDate = (start: DestructuredDate, end: DestructuredDate): FilterQuery<ISession> => {
	if (start.year === end.year && start.month === end.month) {
		return {
			year: start.year,
			month: start.month,
			day: { $gte: start.day, $lte: end.day },
		};
	}

	if (start.year === end.year) {
		return {
			year: start.year,
			$and: [
				{
					$or: [
						{
							month: { $gt: start.month },
						},
						{
							month: start.month,
							day: { $gte: start.day },
						},
					],
				},
				{
					$or: [
						{
							month: { $lt: end.month },
						},
						{
							month: end.month,
							day: { $lte: end.day },
						},
					],
				},
			],
		};
	}

	return {
		$and: [
			{
				$or: [
					{
						year: { $gt: start.year },
					},
					{
						year: start.year,
						month: { $gt: start.month },
					},
					{
						year: start.year,
						month: start.month,
						day: { $gte: start.day },
					},
				],
			},
			{
				$or: [
					{
						year: { $lt: end.year },
					},
					{
						year: end.year,
						month: { $lt: end.month },
					},
					{
						year: end.year,
						month: end.month,
						day: { $lte: end.day },
					},
				],
			},
		],
	};
};

const getGroupSessionsByHour = (
	_id: { range: string; day: string; month: string; year: string } | string,
): { listGroup: object; countGroup: object } => {
	const isOpenSession = { $not: ['$session.closedAt'] };
	const isAfterLoginAt = { $gte: ['$range', { $hour: '$session.loginAt' }] };
	const isBeforeClosedAt = { $lte: ['$range', { $hour: '$session.closedAt' }] };

	const listGroup = {
		$group: {
			_id,
			usersList: {
				$addToSet: {
					$cond: [
						{
							$or: [{ $and: [isOpenSession, isAfterLoginAt] }, { $and: [isAfterLoginAt, isBeforeClosedAt] }],
						},
						'$session.userId',
						'$$REMOVE',
					],
				},
			},
		},
	};

	const countGroup = {
		$addFields: {
			users: { $size: '$usersList' },
		},
	};

	return { listGroup, countGroup };
};

const getSortByFullDate = (): { year: number; month: number; day: number } => ({
	year: -1,
	month: -1,
	day: -1,
});

const getProjectionByFullDate = (): { day: string; month: string; year: string } => ({
	day: '$_id.day',
	month: '$_id.month',
	year: '$_id.year',
});

export const aggregates = {
	dailySessionsOfYesterday(
		collection: Collection<ISession>,
		{ year, month, day }: DestructuredDate,
	): AggregationCursor<
		Pick<ISession, 'mostImportantRole' | 'userId' | 'day' | 'year' | 'month' | 'type'> & {
			time: number;
			sessions: number;
			devices: ISession['device'][];
			_computedAt: string;
		}
	> {
		return collection.aggregate<
			Pick<ISession, 'mostImportantRole' | 'userId' | 'day' | 'year' | 'month' | 'type'> & {
				time: number;
				sessions: number;
				devices: ISession['device'][];
				_computedAt: string;
			}
		>(
			[
				{
					$match: {
						userId: { $exists: true },
						lastActivityAt: { $exists: true },
						device: { $exists: true },
						type: 'session',
						$or: [
							{
								year: { $lt: year },
							},
							{
								year,
								month: { $lt: month },
							},
							{
								year,
								month,
								day: { $lte: day },
							},
						],
					},
				},
				{
					$project: {
						userId: 1,
						device: 1,
						day: 1,
						month: 1,
						year: 1,
						mostImportantRole: 1,
						time: { $trunc: { $divide: [{ $subtract: ['$lastActivityAt', '$loginAt'] }, 1000] } },
					},
				},
				{
					$match: {
						time: { $gt: 0 },
					},
				},
				{
					$group: {
						_id: {
							userId: '$userId',
							device: '$device',
							day: '$day',
							month: '$month',
							year: '$year',
						},
						mostImportantRole: { $first: '$mostImportantRole' },
						time: { $sum: '$time' },
						sessions: { $sum: 1 },
					},
				},
				{
					$sort: {
						time: -1,
					},
				},
				{
					$group: {
						_id: {
							userId: '$_id.userId',
							day: '$_id.day',
							month: '$_id.month',
							year: '$_id.year',
						},
						mostImportantRole: { $first: '$mostImportantRole' },
						time: { $sum: '$time' },
						sessions: { $sum: '$sessions' },
						devices: {
							$push: {
								sessions: '$sessions',
								time: '$time',
								device: '$_id.device',
							},
						},
					},
				},
				{
					$sort: {
						_id: 1,
					},
				},
				{
					$project: {
						_id: 0,
						type: { $literal: 'user_daily' },
						_computedAt: { $literal: new Date() },
						day: '$_id.day',
						month: '$_id.month',
						year: '$_id.year',
						userId: '$_id.userId',
						mostImportantRole: 1,
						time: 1,
						sessions: 1,
						devices: 1,
					},
				},
			],
			{ allowDiskUse: true },
		);
	},

	async getUniqueUsersOfYesterday(
		collection: Collection<ISession>,
		{ year, month, day }: DestructuredDate,
	): Promise<UserSessionAggregation[]> {
		return collection
			.aggregate<UserSessionAggregation>([
				{
					$match: {
						year,
						month,
						day,
						type: 'user_daily',
					},
				},
				{
					$group: {
						_id: {
							day: '$day',
							month: '$month',
							year: '$year',
							mostImportantRole: '$mostImportantRole',
						},
						count: {
							$sum: 1,
						},
						sessions: {
							$sum: '$sessions',
						},
						time: {
							$sum: '$time',
						},
					},
				},
				{
					$group: {
						_id: {
							day: '$day',
							month: '$month',
							year: '$year',
						},
						roles: {
							$push: {
								role: '$_id.mostImportantRole',
								count: '$count',
								sessions: '$sessions',
								time: '$time',
							},
						},
						count: {
							$sum: '$count',
						},
						sessions: {
							$sum: '$sessions',
						},
						time: {
							$sum: '$time',
						},
					},
				},
				{
					$project: {
						_id: 0,
						count: 1,
						sessions: 1,
						time: 1,
						roles: 1,
					},
				},
			])
			.toArray();
	},

	async getUniqueUsersOfLastMonthOrWeek(
		collection: Collection<ISession>,
		{ year, month, day, type = 'month' }: DestructuredDateWithType,
	): Promise<UserSessionAggregation[]> {
		return collection
			.aggregate<UserSessionAggregation>(
				[
					{
						$match: {
							type: 'user_daily',
							...aggregates.getMatchOfLastMonthOrWeek({ year, month, day, type }),
						},
					},
					{
						$group: {
							_id: {
								userId: '$userId',
							},
							mostImportantRole: { $first: '$mostImportantRole' },
							sessions: {
								$sum: '$sessions',
							},
							time: {
								$sum: '$time',
							},
						},
					},
					{
						$group: {
							_id: {
								mostImportantRole: '$mostImportantRole',
							},
							count: {
								$sum: 1,
							},
							sessions: {
								$sum: '$sessions',
							},
							time: {
								$sum: '$time',
							},
						},
					},
					{
						$sort: {
							time: -1,
						},
					},
					{
						$group: {
							_id: 1,
							roles: {
								$push: {
									role: '$_id.mostImportantRole',
									count: '$count',
									sessions: '$sessions',
									time: '$time',
								},
							},
							count: {
								$sum: '$count',
							},
							sessions: {
								$sum: '$sessions',
							},
							time: {
								$sum: '$time',
							},
						},
					},
					{
						$project: {
							_id: 0,
							count: 1,
							roles: 1,
							sessions: 1,
							time: 1,
						},
					},
				],
				{ allowDiskUse: true },
			)
			.toArray();
	},

	getMatchOfLastMonthOrWeek({ year, month, day, type = 'month' }: DestructuredDateWithType): FilterQuery<ISession> {
		let startOfPeriod;

		if (type === 'month') {
			const pastMonthLastDay = new Date(year, month - 1, 0).getDate();
			const currMonthLastDay = new Date(year, month, 0).getDate();

			startOfPeriod = new Date(year, month - 1, day);
			startOfPeriod.setMonth(
				startOfPeriod.getMonth() - 1,
				(currMonthLastDay === day ? pastMonthLastDay : Math.min(pastMonthLastDay, day)) + 1,
			);
		} else {
			startOfPeriod = new Date(year, month - 1, day - 6);
		}

		const startOfPeriodObject = {
			year: startOfPeriod.getFullYear(),
			month: startOfPeriod.getMonth() + 1,
			day: startOfPeriod.getDate(),
		};

		if (year === startOfPeriodObject.year && month === startOfPeriodObject.month) {
			return {
				year,
				month,
				day: { $gte: startOfPeriodObject.day, $lte: day },
			};
		}

		if (year === startOfPeriodObject.year) {
			return {
				year,
				$and: [
					{
						$or: [
							{
								month: { $gt: startOfPeriodObject.month },
							},
							{
								month: startOfPeriodObject.month,
								day: { $gte: startOfPeriodObject.day },
							},
						],
					},
					{
						$or: [
							{
								month: { $lt: month },
							},
							{
								month,
								day: { $lte: day },
							},
						],
					},
				],
			};
		}

		return {
			$and: [
				{
					$or: [
						{
							year: { $gt: startOfPeriodObject.year },
						},
						{
							year: startOfPeriodObject.year,
							month: { $gt: startOfPeriodObject.month },
						},
						{
							year: startOfPeriodObject.year,
							month: startOfPeriodObject.month,
							day: { $gte: startOfPeriodObject.day },
						},
					],
				},
				{
					$or: [
						{
							year: { $lt: year },
						},
						{
							year,
							month: { $lt: month },
						},
						{
							year,
							month,
							day: { $lte: day },
						},
					],
				},
			],
		};
	},

	async getUniqueDevicesOfLastMonthOrWeek(
		collection: Collection<ISession>,
		{ year, month, day, type = 'month' }: DestructuredDateWithType,
	): Promise<DeviceSessionAggregation[]> {
		return collection
			.aggregate<DeviceSessionAggregation>(
				[
					{
						$match: {
							type: 'user_daily',
							...aggregates.getMatchOfLastMonthOrWeek({ year, month, day, type }),
						},
					},
					{
						$unwind: '$devices',
					},
					{
						$group: {
							_id: {
								type: '$devices.device.type',
								name: '$devices.device.name',
								version: '$devices.device.version',
							},
							count: {
								$sum: '$devices.sessions',
							},
							time: {
								$sum: '$devices.time',
							},
						},
					},
					{
						$sort: {
							time: -1,
						},
					},
					{
						$project: {
							_id: 0,
							type: '$_id.type',
							name: '$_id.name',
							version: '$_id.version',
							count: 1,
							time: 1,
						},
					},
				],
				{ allowDiskUse: true },
			)
			.toArray();
	},

	getUniqueDevicesOfYesterday(
		collection: Collection<ISession>,
		{ year, month, day }: DestructuredDate,
	): Promise<DeviceSessionAggregation[]> {
		return collection
			.aggregate<DeviceSessionAggregation>([
				{
					$match: {
						year,
						month,
						day,
						type: 'user_daily',
					},
				},
				{
					$unwind: '$devices',
				},
				{
					$group: {
						_id: {
							type: '$devices.device.type',
							name: '$devices.device.name',
							version: '$devices.device.version',
						},
						count: {
							$sum: '$devices.sessions',
						},
						time: {
							$sum: '$devices.time',
						},
					},
				},
				{
					$sort: {
						time: -1,
					},
				},
				{
					$project: {
						_id: 0,
						type: '$_id.type',
						name: '$_id.name',
						version: '$_id.version',
						count: 1,
						time: 1,
					},
				},
			])
			.toArray();
	},

	getUniqueOSOfLastMonthOrWeek(
		collection: Collection<ISession>,
		{ year, month, day, type = 'month' }: DestructuredDateWithType,
	): Promise<OSSessionAggregation[]> {
		return collection
			.aggregate<OSSessionAggregation>(
				[
					{
						$match: {
							'type': 'user_daily',
							'devices.device.os.name': {
								$exists: true,
							},
							...aggregates.getMatchOfLastMonthOrWeek({ year, month, day, type }),
						},
					},
					{
						$unwind: '$devices',
					},
					{
						$group: {
							_id: {
								name: '$devices.device.os.name',
								version: '$devices.device.os.version',
							},
							count: {
								$sum: '$devices.sessions',
							},
							time: {
								$sum: '$devices.time',
							},
						},
					},
					{
						$sort: {
							time: -1,
						},
					},
					{
						$project: {
							_id: 0,
							name: '$_id.name',
							version: '$_id.version',
							count: 1,
							time: 1,
						},
					},
				],
				{ allowDiskUse: true },
			)
			.toArray();
	},

	getUniqueOSOfYesterday(collection: Collection<ISession>, { year, month, day }: DestructuredDate): Promise<OSSessionAggregation[]> {
		return collection
			.aggregate<OSSessionAggregation>([
				{
					$match: {
						year,
						month,
						day,
						'type': 'user_daily',
						'devices.device.os.name': {
							$exists: true,
						},
					},
				},
				{
					$unwind: '$devices',
				},
				{
					$group: {
						_id: {
							name: '$devices.device.os.name',
							version: '$devices.device.os.version',
						},
						count: {
							$sum: '$devices.sessions',
						},
						time: {
							$sum: '$devices.time',
						},
					},
				},
				{
					$sort: {
						time: -1,
					},
				},
				{
					$project: {
						_id: 0,
						name: '$_id.name',
						version: '$_id.version',
						count: 1,
						time: 1,
					},
				},
			])
			.toArray();
	},
};

export class SessionsRaw extends BaseRaw<ISession> {
	private secondaryCollection: Collection<ISession>;

	constructor(public readonly col: Collection<ISession>, public readonly colSecondary: Collection<ISession>, trash?: Collection<ISession>) {
		super(col, trash);

		this.secondaryCollection = colSecondary;
	}

	protected modelIndexes(): IndexSpecification[] {
		return [
			{ key: { instanceId: 1, sessionId: 1, year: 1, month: 1, day: 1 } },
			{ key: { instanceId: 1, sessionId: 1, userId: 1 } },
			{ key: { instanceId: 1, sessionId: 1 } },
			{ key: { sessionId: 1 } },
			{ key: { userId: 1 } },
			{ key: { year: 1, month: 1, day: 1, type: 1 } },
			{ key: { type: 1 } },
			{ key: { ip: 1, loginAt: 1 } },
			{ key: { _computedAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 45 },
		];
	}

	async getActiveUsersBetweenDates({ start, end }: DestructuredRange): Promise<ISession[]> {
		return this.col
			.aggregate([
				{
					$match: {
						...matchBasedOnDate(start, end),
						type: 'user_daily',
					},
				},
				{
					$group: {
						_id: '$userId',
					},
				},
			])
			.toArray();
	}

	async findLastLoginByIp(ip: string): Promise<ISession | null> {
		return this.findOne(
			{
				ip,
			},
			{
				sort: { loginAt: -1 },
				limit: 1,
			},
		);
	}

	findOneBySessionId(sessionId: string): Promise<ISession | null> {
		return this.findOne({ sessionId });
	}

	findSessionsNotClosedByDateWithoutLastActivity({ year, month, day }: DestructuredDate): Cursor<ISession> {
		const query = {
			year,
			month,
			day,
			type: 'session',
			closedAt: { $exists: false },
			lastActivityAt: { $exists: false },
		};

		return this.find(query);
	}

	async getActiveUsersOfPeriodByDayBetweenDates({ start, end }: DestructuredRange): Promise<
		{
			day: number;
			month: number;
			year: number;
			usersList: IUser['_id'][];
			users: number;
		}[]
	> {
		return this.col
			.aggregate<{
				day: number;
				month: number;
				year: number;
				usersList: IUser['_id'][];
				users: number;
			}>([
				{
					$match: {
						...matchBasedOnDate(start, end),
						type: 'user_daily',
						mostImportantRole: { $ne: 'anonymous' },
					},
				},
				{
					$group: {
						_id: {
							day: '$day',
							month: '$month',
							year: '$year',
							userId: '$userId',
						},
					},
				},
				{
					$group: {
						_id: {
							day: '$_id.day',
							month: '$_id.month',
							year: '$_id.year',
						},
						usersList: {
							$addToSet: '$_id.userId',
						},
						users: { $sum: 1 },
					},
				},
				{
					$project: {
						_id: 0,
						...getProjectionByFullDate(),
						usersList: 1,
						users: 1,
					},
				},
				{
					$sort: {
						...getSortByFullDate(),
					},
				},
			])
			.toArray();
	}

	async getBusiestTimeWithinHoursPeriod({ start, end, groupSize }: DateRange & { groupSize: number }): Promise<
		{
			hour: number;
			users: number;
		}[]
	> {
		const match = {
			$match: {
				type: 'computed-session',
				loginAt: { $gte: start, $lte: end },
			},
		};
		const rangeProject = {
			$project: {
				range: {
					$range: [0, 24, groupSize],
				},
				session: '$$ROOT',
			},
		};
		const unwind = {
			$unwind: '$range',
		};
		const groups = getGroupSessionsByHour('$range');
		const presentationProject = {
			$project: {
				_id: 0,
				hour: '$_id',
				users: 1,
			},
		};
		const sort = {
			$sort: {
				hour: -1,
			},
		};
		return this.col
			.aggregate<{
				hour: number;
				users: number;
			}>([match, rangeProject, unwind, groups.listGroup, groups.countGroup, presentationProject, sort])
			.toArray();
	}

	async getTotalOfSessionsByDayBetweenDates({ start, end }: DestructuredRange): Promise<
		{
			day: number;
			month: number;
			year: number;
			users: number;
		}[]
	> {
		return this.col
			.aggregate<{
				day: number;
				month: number;
				year: number;
				users: number;
			}>([
				{
					$match: {
						...matchBasedOnDate(start, end),
						type: 'user_daily',
						mostImportantRole: { $ne: 'anonymous' },
					},
				},
				{
					$group: {
						_id: { year: '$year', month: '$month', day: '$day' },
						users: { $sum: 1 },
					},
				},
				{
					$project: {
						_id: 0,
						...getProjectionByFullDate(),
						users: 1,
					},
				},
				{
					$sort: {
						...getSortByFullDate(),
					},
				},
			])
			.toArray();
	}

	async getTotalOfSessionByHourAndDayBetweenDates({ start, end }: DateRange): Promise<
		{
			hour: number;
			day: number;
			month: number;
			year: number;
			users: number;
		}[]
	> {
		const match = {
			$match: {
				type: 'computed-session',
				loginAt: { $gte: start, $lte: end },
			},
		};
		const rangeProject = {
			$project: {
				range: {
					$range: [{ $hour: '$loginAt' }, { $sum: [{ $ifNull: [{ $hour: '$closedAt' }, 23] }, 1] }],
				},
				session: '$$ROOT',
			},
		};
		const unwind = {
			$unwind: '$range',
		};
		const groups = getGroupSessionsByHour({
			range: '$range',
			day: '$session.day',
			month: '$session.month',
			year: '$session.year',
		});
		const presentationProject = {
			$project: {
				_id: 0,
				hour: '$_id.range',
				...getProjectionByFullDate(),
				users: 1,
			},
		};
		const sort = {
			$sort: {
				...getSortByFullDate(),
				hour: -1,
			},
		};

		return this.col
			.aggregate<{
				hour: number;
				day: number;
				month: number;
				year: number;
				users: number;
			}>([match, rangeProject, unwind, groups.listGroup, groups.countGroup, presentationProject, sort])
			.toArray();
	}

	async getUniqueUsersOfYesterday(): Promise<UserSessionAggregationResult> {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: await aggregates.getUniqueUsersOfYesterday(this.secondaryCollection, {
				year,
				month,
				day,
			}),
		};
	}

	async getUniqueUsersOfLastMonth(): Promise<UserSessionAggregationResult> {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: await aggregates.getUniqueUsersOfLastMonthOrWeek(this.secondaryCollection, {
				year,
				month,
				day,
			}),
		};
	}

	async getUniqueUsersOfLastWeek(): Promise<UserSessionAggregationResult> {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: await aggregates.getUniqueUsersOfLastMonthOrWeek(this.secondaryCollection, {
				year,
				month,
				day,
				type: 'week',
			}),
		};
	}

	async getUniqueDevicesOfYesterday(): Promise<DeviceSessionAggregationResult> {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: await aggregates.getUniqueDevicesOfYesterday(this.secondaryCollection, {
				year,
				month,
				day,
			}),
		};
	}

	async getUniqueDevicesOfLastMonth(): Promise<DeviceSessionAggregationResult> {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: await aggregates.getUniqueDevicesOfLastMonthOrWeek(this.secondaryCollection, {
				year,
				month,
				day,
			}),
		};
	}

	async getUniqueDevicesOfLastWeek(): Promise<DeviceSessionAggregationResult> {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: await aggregates.getUniqueDevicesOfLastMonthOrWeek(this.secondaryCollection, {
				year,
				month,
				day,
				type: 'week',
			}),
		};
	}

	async getUniqueOSOfYesterday(): Promise<OSSessionAggregationResult> {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: await aggregates.getUniqueOSOfYesterday(this.secondaryCollection, { year, month, day }),
		};
	}

	async getUniqueOSOfLastMonth(): Promise<OSSessionAggregationResult> {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: await aggregates.getUniqueOSOfLastMonthOrWeek(this.secondaryCollection, {
				year,
				month,
				day,
			}),
		};
	}

	async getUniqueOSOfLastWeek(): Promise<OSSessionAggregationResult> {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: await aggregates.getUniqueOSOfLastMonthOrWeek(this.secondaryCollection, {
				year,
				month,
				day,
				type: 'week',
			}),
		};
	}

	async createOrUpdate(data: Omit<ISession, '_id' | 'createdAt' | '_updatedAt'>): Promise<UpdateWriteOpResult | undefined> {
		const { year, month, day, sessionId, instanceId } = data;

		if (!year || !month || !day || !sessionId || !instanceId) {
			return;
		}

		const now = new Date();

		return this.updateOne(
			{ instanceId, sessionId, year, month, day },
			{
				$set: data,
				$setOnInsert: {
					createdAt: now,
				},
			},
			{ upsert: true },
		);
	}

	async closeByInstanceIdAndSessionId(instanceId: string, sessionId: string): Promise<UpdateWriteOpResult> {
		const query = {
			instanceId,
			sessionId,
			closedAt: { $exists: false },
		};

		const closeTime = new Date();
		const update = {
			$set: {
				closedAt: closeTime,
				lastActivityAt: closeTime,
			},
		};

		return this.updateOne(query, update);
	}

	async updateActiveSessionsByDateAndInstanceIdAndIds(
		{ year, month, day }: Partial<DestructuredDate> = {},
		instanceId: string,
		sessions: string[],
		data = {},
	): Promise<UpdateWriteOpResult> {
		const query = {
			instanceId,
			year,
			month,
			day,
			sessionId: { $in: sessions },
			closedAt: { $exists: false },
		};

		const update = {
			$set: data,
		};

		return this.updateMany(query, update);
	}

	async updateActiveSessionsByDate({ year, month, day }: DestructuredDate, data = {}): Promise<UpdateWriteOpResult> {
		const query = {
			year,
			month,
			day,
			type: 'session',
			closedAt: { $exists: false },
			lastActivityAt: { $exists: false },
		};

		const update = {
			$set: data,
		};

		return this.updateMany(query, update);
	}

	async logoutByInstanceIdAndSessionIdAndUserId(instanceId: string, sessionId: string, userId: string): Promise<UpdateWriteOpResult> {
		const query = {
			instanceId,
			sessionId,
			userId,
			logoutAt: { $exists: 0 },
		};

		const logoutAt = new Date();
		const update = {
			$set: {
				logoutAt,
			},
		};

		return this.updateMany(query, update);
	}

	async createBatch(sessions: ModelOptionalId<ISession>[]): Promise<BulkWriteOpResultObject | undefined> {
		if (!sessions || sessions.length === 0) {
			return;
		}

		const ops: BulkWriteOperation<ISession>[] = [];
		sessions.forEach((doc) => {
			const { year, month, day, sessionId, instanceId } = doc;
			delete doc._id;

			ops.push({
				updateOne: {
					filter: { year, month, day, sessionId, instanceId },
					update: {
						$set: doc,
					},
					upsert: true,
				},
			});
		});

		return this.col.bulkWrite(ops, { ordered: false });
	}
}
