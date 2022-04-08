import { Base } from './_Base';

export class LivechatAgentActivity extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ date: 1 });
		this.tryEnsureIndex({ agentId: 1, date: 1 }, { unique: true });
		this.tryEnsureIndex({ agentId: 1 });
	}

	createOrUpdate(data = {}) {
		const { date, agentId, lastStartedAt } = data;

		if (!date || !agentId) {
			return;
		}

		return this.upsert(
			{ agentId, date },
			{
				$unset: {
					lastStoppedAt: 1,
				},
				$set: {
					lastStartedAt: lastStartedAt || new Date(),
				},
				$setOnInsert: {
					date,
					agentId,
				},
			},
		);
	}

	updateLastStoppedAt({ agentId, date, lastStoppedAt, availableTime }) {
		const query = {
			agentId,
			date,
		};
		const update = {
			$inc: { availableTime },
			$set: {
				lastStoppedAt,
			},
		};
		return this.update(query, update);
	}

	updateServiceHistory({ agentId, date, serviceHistory }) {
		const query = {
			agentId,
			date,
		};
		const update = {
			$addToSet: {
				serviceHistory,
			},
		};
		return this.update(query, update);
	}

	findOpenSessions() {
		const query = {
			lastStoppedAt: { $exists: false },
		};

		return this.find(query);
	}
}

export default new LivechatAgentActivity('livechat_agent_activity');
