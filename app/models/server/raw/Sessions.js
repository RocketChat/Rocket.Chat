import { BaseRaw } from './BaseRaw';
import Sessions from '../models/Sessions';

const matchBasedOnDate = (start, end) => {
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
			$and: [{
				$or: [{
					month: { $gt: start.month },
				}, {
					month: start.month,
					day: { $gte: start.day },
				}],
			}, {
				$or: [{
					month: { $lt: end.month },
				}, {
					month: end.month,
					day: { $lte: end.day },
				}],
			}],
		};
	}

	return {
		$and: [{
			$or: [{
				year: { $gt: start.year },
			}, {
				year: start.year,
				month: { $gt: start.month },
			}, {
				year: start.year,
				month: start.month,
				day: { $gte: start.day },
			}],
		}, {
			$or: [{
				year: { $lt: end.year },
			}, {
				year: end.year,
				month: { $lt: end.month },
			}, {
				year: end.year,
				month: end.month,
				day: { $lte: end.day },
			}],
		}],
	};
};

const getGroupSessionsByHour = (_id) => {
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
							$or: [
								{ $and: [isOpenSession, isAfterLoginAt] },
								{ $and: [isAfterLoginAt, isBeforeClosedAt] },
							],
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

const getSortByFullDate = () => ({
	year: -1,
	month: -1,
	day: -1,
});

const getProjectionByFullDate = () => ({
	day: '$_id.day',
	month: '$_id.month',
	year: '$_id.year',
});

export class SessionsRaw extends BaseRaw {
	getActiveUsersBetweenDates({ start, end }) {
		return this.col.aggregate([
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
		]).toArray();
	}

	async findLastLoginByIp(ip) {
		return (await this.col.find({
			ip,
		}, {
			sort: { loginAt: -1 },
			limit: 1,
		}).toArray())[0];
	}

	getActiveUsersOfPeriodByDayBetweenDates({ start, end }) {
		return this.col.aggregate([
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
		]).toArray();
	}

	getBusiestTimeWithinHoursPeriod({ start, end, groupSize }) {
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
		return this.col.aggregate([match, rangeProject, unwind, groups.listGroup, groups.countGroup, presentationProject, sort]).toArray();
	}

	getTotalOfSessionsByDayBetweenDates({ start, end }) {
		return this.col.aggregate([
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
		]).toArray();
	}

	getTotalOfSessionByHourAndDayBetweenDates({ start, end }) {
		const match = {
			$match: {
				type: 'computed-session',
				loginAt: { $gte: start, $lte: end },
			},
		};
		const rangeProject = {
			$project: {
				range: {
					$range: [
						{ $hour: '$loginAt' },
						{ $sum: [{ $ifNull: [{ $hour: '$closedAt' }, 23] }, 1] }],
				},
				session: '$$ROOT',
			},

		};
		const unwind = {
			$unwind: '$range',
		};
		const groups = getGroupSessionsByHour({ range: '$range', day: '$session.day', month: '$session.month', year: '$session.year' });
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
		return this.col.aggregate([match, rangeProject, unwind, groups.listGroup, groups.countGroup, presentationProject, sort]).toArray();
	}
}

export default new SessionsRaw(Sessions.model.rawCollection());
