/**
 * Livechat Department model
 */
class LivechatDepartmentAgents extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('livechat_department_agents');
	}

	findByDepartmentId(departmentId) {
		return this.find({ departmentId: departmentId });
	}

	saveAgent(agent) {
		if (agent._id) {
			return this.update({ _id: _id }, { $set: agent });
		} else {
			return this.upsert({
				agentId: agent.agentId,
				departmentId: agent.departmentId
			}, {
				$set: {
					username: agent.username,
					count: agent.count,
					order: agent.order
				}
			});
		}
	}

	removeByDepartmentIdAndAgentId(departmentId, agentId) {
		this.remove({ departmentId: departmentId, agentId: agentId });
	}
}

RocketChat.models.LivechatDepartmentAgents = new LivechatDepartmentAgents();
