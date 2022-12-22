import _ from 'underscore';

import { Base } from './_Base';
import LivechatDepartmentAgents from './LivechatDepartmentAgents';
/**
 * Livechat Department model
 */
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

	// FIND
	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	findByDepartmentId(_id, options) {
		const query = { _id };

		return this.find(query, options);
	}

	createOrUpdateDepartment(_id, data = {}) {
		const oldData = _id && this.findOneById(_id);

		const record = {
			...data,
		};

		if (_id) {
			this.update({ _id }, { $set: record });
		} else {
			_id = this.insert(record);
		}
		if (oldData && oldData.enabled !== data.enabled) {
			LivechatDepartmentAgents.setDepartmentEnabledByDepartmentId(_id, data.enabled);
		}
		return _.extend(record, { _id });
	}

	saveDepartmentsByAgent(agent, departments = []) {
		const { _id: agentId, username } = agent;
		const savedDepartments = LivechatDepartmentAgents.findByAgentId(agentId)
			.fetch()
			.map((d) => d.departmentId);

		const incNumAgents = (_id, numAgents) => this.update(_id, { $inc: { numAgents } });
		// remove other departments
		_.difference(savedDepartments, departments).forEach((departmentId) => {
			LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(departmentId, agentId);
			incNumAgents(departmentId, -1);
		});

		departments.forEach((departmentId) => {
			const { enabled: departmentEnabled } = this.findOneById(departmentId, {
				fields: { enabled: 1 },
			});
			const saveResult = LivechatDepartmentAgents.saveAgent({
				agentId,
				departmentId,
				username,
				departmentEnabled,
				count: 0,
				order: 0,
			});

			if (saveResult.insertedId) {
				incNumAgents(departmentId, 1);
			}
		});
	}

	updateById(_id, update) {
		return this.update({ _id }, update);
	}

	updateNumAgentsById(_id, numAgents) {
		return this.update({ _id }, { $set: { numAgents } });
	}

	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.remove(query);
	}

	findEnabledWithAgents(fields = undefined) {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true,
		};
		return this.find(query, fields && { fields });
	}

	findEnabledWithAgentsAndBusinessUnit(_, fields) {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true,
		};
		return this.find(query, fields && { fields });
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
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

	unsetFallbackDepartmentByDepartmentId(_id) {
		return this.update(
			{ fallbackForwardDepartment: _id },
			{
				$unset: {
					fallbackForwardDepartment: 1,
				},
			},
			{ multi: true },
		);
	}
}

export default new LivechatDepartment();
