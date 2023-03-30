import { Base } from './_Base';
/**
 * Livechat Department model
 */
// Promise.await added here will be removed when this model gets removed, dont panic :)
export class LivechatDepartment extends Base {
	constructor(modelOrName) {
		super(modelOrName || 'livechat_department');

		this.tryEnsureIndex({ name: 1 });
		this.tryEnsureIndex({ businessHourId: 1 }, { sparse: true });
		this.tryEnsureIndex({ type: 1 }, { sparse: true });
		this.tryEnsureIndex({
			numAgents: 1,
			enabled: 1,
		});
		this.tryEnsureIndex({ parentId: 1 }, { sparse: true });
		this.tryEnsureIndex({ ancestors: 1 }, { sparse: true });
	}

	// Still in use by EE model
	findEnabledWithAgents(fields = undefined) {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true,
		};
		return this.find(query, fields && { fields });
	}

	findByUnitIds(unitIds, options) {
		const query = {
			parentId: {
				$exists: true,
				$in: unitIds,
			},
		};

		return this.find(query, options);
	}

	findActiveByUnitIds(unitIds, options) {
		const query = {
			enabled: true,
			numAgents: { $gt: 0 },
			parentId: {
				$exists: true,
				$in: unitIds,
			},
		};

		return this.find(query, options);
	}
}

export default new LivechatDepartment();
