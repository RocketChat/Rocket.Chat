import { Base } from './_Base';

export class LivechatAgentActivity extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ date: 1 });
		this.tryEnsureIndex({ agentId: 1, date: 1 }, { unique: true });
		this.tryEnsureIndex({ agentId: 1 });
	}

	createOrUpdate(data = {}) {
		const { date, agentId } = data;

		if (!date || !agentId) {
			return;
		}

		return this.upsert({ agentId, date }, {
			$unset: {
				lastStopedAt: 1,
			},
			$set: {
				lastStartedAt: new Date(),
			},
			$setOnInsert: {
				date,
				agentId,
			},
		});
	}

	updateLastStoppedAt({ agentId, date, lastStopedAt, availableTime }) {
		const query = {
			agentId,
			date,
		};
		const update = {
			$inc: { availableTime },
			$set: {
				lastStopedAt,
			},
		};
		return this.update(query, update);
	}

	updateServiceHistory({ agentId, date, historyObject }) {
		const query = {
			agentId,
			date,
		};
		const update = {
			$addToSet: {
				serviceHistory: historyObject,
			},
		};
		return this.update(query, update);
	}
}

export default new LivechatAgentActivity('livechat_agent_activity');
