import { Base } from './_Base';

export class LivechatSessions extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ year: 1, month: 1, day: 1 });
		this.tryEnsureIndex({ agentId: 1, year: 1, month: 1, day: 1 });
		this.tryEnsureIndex({ agentId: 1 });
	}

	createOrUpdate(data = {}) {
		const { year, month, day, agentId } = data;

		if (!year || !month || !day || !agentId) {
			return;
		}

		return this.upsert({ agentId, year, month, day }, {
			$unset: {
				lastStopedAt: 1,
			},
			$set: {
				...data,
				lastStartedAt: new Date(),
			},
		});
	}

	updateLastStoppedAt({ agentId, year, month, day, lastStopedAt, availableTime }) {
		const query = {
			agentId,
			year,
			month,
			day,
		};
		const update = {
			$inc: { availableTime },
			$set: {
				lastStopedAt,
			},
		};
		return this.update(query, update);
	}

	updateServiceHistory({ agentId, year, month, day, historyObject }) {
		const query = {
			agentId,
			year,
			month,
			day,
		};
		const update = {
			$addToSet: {
				serviceHistory: historyObject,
			},
		};
		return this.update(query, update);
	}
}

export default new LivechatSessions('livechat_sessions');
