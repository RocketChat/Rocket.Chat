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
			return this.insert(agent);
		}
	}
}

RocketChat.models.LivechatDepartmentAgents = new LivechatDepartmentAgents();
