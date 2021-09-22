import { Base } from './_Base';
import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';

export const aggregates = {
	dailySessionsOfYesterday(collection, { year, month, day }) {
		return collection.aggregate([{
			$match: {
				userId: { $exists: true },
				lastActivityAt: { $exists: true },
				device: { $exists: true },
				type: 'session',
				$or: [{
					year: { $lt: year },
				}, {
					year,
					month: { $lt: month },
				}, {
					year,
					month,
					day: { $lte: day },
				}],
			},
		}, {
			$sort: {
				_id: 1,
			},
		}, {
			$project: {
				userId: 1,
				device: 1,
				day: 1,
				month: 1,
				year: 1,
				mostImportantRole: 1,
				time: { $trunc: { $divide: [{ $subtract: ['$lastActivityAt', '$loginAt'] }, 1000] } },
			},
		}, {
			$match: {
				time: { $gt: 0 },
			},
		}, {
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
		}, {
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
		}, {
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
		}], { allowDiskUse: true });
	},

	getUniqueUsersOfYesterday(collection, { year, month, day }) {
		return collection.aggregate([{
			$match: {
				year,
				month,
				day,
				type: 'user_daily',
			},
		}, {
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
		}, {
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
		}, {
			$project: {
				_id: 0,
				count: 1,
				sessions: 1,
				time: 1,
				roles: 1,
			},
		}]).toArray();
	},

	getUniqueUsersOfLastMonthOrWeek(collection, { year, month, day, type = 'month' }) {
		return collection.aggregate([{
			$match: {
				type: 'user_daily',
				...aggregates.getMatchOfLastMonthOrWeek({ year, month, day, type }),
			},
		}, {
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
		}, {
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
		}, {
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
		}, {
			$project: {
				_id: 0,
				count: 1,
				roles: 1,
				sessions: 1,
				time: 1,
			},
		}], { allowDiskUse: true }).toArray();
	},

	getMatchOfLastMonthOrWeek({ year, month, day, type = 'month' }) {
		let startOfPeriod;

		if (type === 'month') {
			const pastMonthLastDay = new Date(year, month - 1, 0).getDate();
			const currMonthLastDay = new Date(year, month, 0).getDate();

			startOfPeriod = new Date(year, month - 1, day);
			startOfPeriod.setMonth(startOfPeriod.getMonth() - 1, (currMonthLastDay === day ? pastMonthLastDay : Math.min(pastMonthLastDay, day)) + 1);
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
				$and: [{
					$or: [{
						month: { $gt: startOfPeriodObject.month },
					}, {
						month: startOfPeriodObject.month,
						day: { $gte: startOfPeriodObject.day },
					}],
				}, {
					$or: [{
						month: { $lt: month },
					}, {
						month,
						day: { $lte: day },
					}],
				}],
			};
		}

		return {
			$and: [{
				$or: [{
					year: { $gt: startOfPeriodObject.year },
				}, {
					year: startOfPeriodObject.year,
					month: { $gt: startOfPeriodObject.month },
				}, {
					year: startOfPeriodObject.year,
					month: startOfPeriodObject.month,
					day: { $gte: startOfPeriodObject.day },
				}],
			}, {
				$or: [{
					year: { $lt: year },
				}, {
					year,
					month: { $lt: month },
				}, {
					year,
					month,
					day: { $lte: day },
				}],
			}],
		};
	},

	getUniqueDevicesOfLastMonthOrWeek(collection, { year, month, day, type = 'month' }) {
		return collection.aggregate([{
			$match: {
				type: 'user_daily',
				...aggregates.getMatchOfLastMonthOrWeek({ year, month, day, type }),
			},
		}, {
			$unwind: '$devices',
		}, {
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
		}, {
			$project: {
				_id: 0,
				type: '$_id.type',
				name: '$_id.name',
				version: '$_id.version',
				count: 1,
				time: 1,
			},
		}], { allowDiskUse: true }).toArray();
	},

	getUniqueDevicesOfYesterday(collection, { year, month, day }) {
		return collection.aggregate([{
			$match: {
				year,
				month,
				day,
				type: 'user_daily',
			},
		}, {
			$unwind: '$devices',
		}, {
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
		}, {
			$project: {
				_id: 0,
				type: '$_id.type',
				name: '$_id.name',
				version: '$_id.version',
				count: 1,
				time: 1,
			},
		}]).toArray();
	},

	getUniqueOSOfLastMonthOrWeek(collection, { year, month, day, type = 'month' }) {
		return collection.aggregate([{
			$match: {
				type: 'user_daily',
				'devices.device.os.name': {
					$exists: true,
				},
				...aggregates.getMatchOfLastMonthOrWeek({ year, month, day, type }),
			},
		}, {
			$unwind: '$devices',
		}, {
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
		}, {
			$project: {
				_id: 0,
				name: '$_id.name',
				version: '$_id.version',
				count: 1,
				time: 1,
			},
		}], { allowDiskUse: true }).toArray();
	},

	getUniqueOSOfYesterday(collection, { year, month, day }) {
		return collection.aggregate([{
			$match: {
				year,
				month,
				day,
				type: 'user_daily',
				'devices.device.os.name': {
					$exists: true,
				},
			},
		}, {
			$unwind: '$devices',
		}, {
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
		}, {
			$project: {
				_id: 0,
				name: '$_id.name',
				version: '$_id.version',
				count: 1,
				time: 1,
			},
		}]).toArray();
	},
};

export class Sessions extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ instanceId: 1, sessionId: 1, year: 1, month: 1, day: 1 });
		this.tryEnsureIndex({ instanceId: 1, sessionId: 1, userId: 1 });
		this.tryEnsureIndex({ instanceId: 1, sessionId: 1 });
		this.tryEnsureIndex({ sessionId: 1 });
		this.tryEnsureIndex({ userId: 1 });
		this.tryEnsureIndex({ year: 1, month: 1, day: 1, type: 1 });
		this.tryEnsureIndex({ type: 1 });
		this.tryEnsureIndex({ ip: 1, loginAt: 1 });
		this.tryEnsureIndex({ _computedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 45 });

		const db = this.model.rawDatabase();
		this.secondaryCollection = db.collection(this.model._name, { readPreference: readSecondaryPreferred(db) });
	}

	getUniqueUsersOfYesterday() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(aggregates.getUniqueUsersOfYesterday(this.secondaryCollection, { year, month, day })),
		};
	}

	getUniqueUsersOfLastMonth() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(aggregates.getUniqueUsersOfLastMonthOrWeek(this.secondaryCollection, { year, month, day })),
		};
	}

	getUniqueUsersOfLastWeek() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(aggregates.getUniqueUsersOfLastMonthOrWeek(this.secondaryCollection, { year, month, day, type: 'week' })),
		};
	}

	getUniqueDevicesOfYesterday() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(aggregates.getUniqueDevicesOfYesterday(this.secondaryCollection, { year, month, day })),
		};
	}

	getUniqueDevicesOfLastMonth() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(aggregates.getUniqueDevicesOfLastMonthOrWeek(this.secondaryCollection, { year, month, day })),
		};
	}

	getUniqueDevicesOfLastWeek() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(aggregates.getUniqueDevicesOfLastMonthOrWeek(this.secondaryCollection, { year, month, day, type: 'week' })),
		};
	}

	getUniqueOSOfYesterday() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(aggregates.getUniqueOSOfYesterday(this.secondaryCollection, { year, month, day })),
		};
	}

	getUniqueOSOfLastMonth() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(aggregates.getUniqueOSOfLastMonthOrWeek(this.secondaryCollection, { year, month, day })),
		};
	}

	getUniqueOSOfLastWeek() {
		const date = new Date();
		date.setDate(date.getDate() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();

		return {
			year,
			month,
			day,
			data: Promise.await(aggregates.getUniqueOSOfLastMonthOrWeek(this.secondaryCollection, { year, month, day, type: 'week' })),
		};
	}

	createOrUpdate(data = {}) {
		const { year, month, day, sessionId, instanceId } = data;

		if (!year || !month || !day || !sessionId || !instanceId) {
			return;
		}

		const now = new Date();

		return this.upsert({ instanceId, sessionId, year, month, day }, {
			$set: data,
			$setOnInsert: {
				createdAt: now,
			},
		});
	}

	closeByInstanceIdAndSessionId(instanceId, sessionId) {
		const query = {
			instanceId,
			sessionId,
			closedAt: { $exists: 0 },
		};

		const closeTime = new Date();
		const update = {
			$set: {
				closedAt: closeTime,
				lastActivityAt: closeTime,
			},
		};

		return this.update(query, update);
	}

	updateActiveSessionsByDateAndInstanceIdAndIds({ year, month, day } = {}, instanceId, sessions, data = {}) {
		const query = {
			instanceId,
			year,
			month,
			day,
			sessionId: { $in: sessions },
			closedAt: { $exists: 0 },
		};

		const update = {
			$set: data,
		};

		return this.update(query, update, { multi: true });
	}

	logoutByInstanceIdAndSessionIdAndUserId(instanceId, sessionId, userId) {
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

		return this.update(query, update, { multi: true });
	}

	createBatch(sessions) {
		if (!sessions || sessions.length === 0) {
			return;
		}

		const ops = [];
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

		return this.model.rawCollection().bulkWrite(ops, { ordered: false });
	}
}

export default new Sessions('sessions');
