class ModelSessions extends RocketChat.models._Base {
	constructor() {
		super(...arguments);

		this.tryEnsureIndex({ 'year': 1, 'month': 1, 'day': 1, 'sessionId': 1 }, { unique: 1 });
		this.tryEnsureIndex({ 'year': 1, 'month': 1, 'day': 1 });
		this.tryEnsureIndex({ 'sessionId': 1, 'userId': 1 });
		this.tryEnsureIndex({ 'sessionId': 1 });
	}

	createOrUpdate(data = {}) {
		const { year, month, day, sessionId } = data;

		if (!(year && month && day && sessionId)) {
			return;
		}

		const now = new Date;

		return this.upsert({ year, month, day, sessionId }, {
			$set: data,
			$setOnInsert: {
				createdAt: now
			}
		});
	}

	updateBySessionId(sessionId, data = {}) {
		const query = {
			sessionId
		};

		const update = {
			$set: data
		};

		return this.update(query, update, { multi: true });
	}

	updateActiveSessionsByDateAndIds({ year, month, day } = {}, sessions, data = {}) {
		const query = {
			year,
			month,
			day,
			sessionId: { $in: sessions },
			closedAt: { $exists: 0 }
		};

		const update = {
			$set: data
		};

		return this.update(query, update, { multi: true });
	}

	updateBySessionIdAndUserId(sessionId, userId, data = {}) {
		const query = { sessionId, userId };
		const update = {
			$set: data
		};

		return this.update(query, update, { multi: true });
	}
}

RocketChat.models.Sessions = new ModelSessions('sessions');
