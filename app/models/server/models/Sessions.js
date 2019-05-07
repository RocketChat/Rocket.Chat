import { Base } from './_Base';

export const aggregates = {
	dailySessionsOfYesterday(collection, { year, month, day }) {
		return collection.aggregate([{
			$match: {
				userId: { $exists: true },
				lastActivityAt: { $exists: true },
				device: { $exists: true },
				type: 'session',
				year: { $lte: year },
				month: { $lte: month },
				day: { $lte: day },
			},
		}, {
			$project: {
				userId: 1,
				device: 1,
				day: 1,
				month: 1,
				year: 1,
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
				time: 1,
				sessions: 1,
				devices: 1,
			},
		}]).toArray();
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
			$project: {
				_id: 0,
				count: 1,
				sessions: 1,
				time: 1,
			},
		}]).toArray();
	},

	getUniqueUsersOfLastMonth(collection, { year, month }) {
		return collection.aggregate([{
			$match: {
				year,
				month,
				type: 'user_daily',
			},
		}, {
			$group: {
				_id: {
					userId: '$userId',
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
			$project: {
				_id: 0,
				count: 1,
				sessions: 1,
				time: 1,
			},
		}]).toArray();
	},

	getUniqueDevicesOfLastMonth(collection, { year, month }) {
		return collection.aggregate([{
			$match: {
				year,
				month,
				type: 'user_daily',
			},
		}, {
			$unwind: '$devices',
		}, {
			$group: {
				_id: {
					type : '$devices.device.type',
					name : '$devices.device.name',
					version : '$devices.device.version',
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
					type : '$devices.device.type',
					name : '$devices.device.name',
					version : '$devices.device.version',
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

	getUniqueOSOfLastMonth(collection, { year, month }) {
		return collection.aggregate([{
			$match: {
				year,
				month,
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
					name : '$devices.device.os.name',
					version : '$devices.device.os.version',
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
					name : '$devices.device.os.name',
					version : '$devices.device.os.version',
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
		this.tryEnsureIndex({ year: 1, month: 1, day: 1, type: 1 });
		this.tryEnsureIndex({ _computedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 45 });
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
			data: Promise.await(aggregates.getUniqueUsersOfYesterday(this.model.rawCollection(), { year, month, day })),
		};
	}

	getUniqueUsersOfLastMonth() {
		const date = new Date();
		date.setMonth(date.getMonth() - 1);

		const year = date.getFullYear();
		const month = date.getMonth() + 1;

		return {
			year,
			month,
			data: Promise.await(aggregates.getUniqueUsersOfLastMonth(this.model.rawCollection(), { year, month })),
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
			data: Promise.await(aggregates.getUniqueDevicesOfYesterday(this.model.rawCollection(), { year, month, day })),
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
			data: Promise.await(aggregates.getUniqueOSOfYesterday(this.model.rawCollection(), { year, month, day })),
		};
	}

	createOrUpdate(data = {}) {
		const { year, month, day, sessionId, instanceId } = data;

		if (!year || !month || !day || !sessionId || !instanceId) {
			return;
		}

		const now = new Date;

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
