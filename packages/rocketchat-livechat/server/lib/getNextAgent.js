this.getNextAgent = function(department) {
	var agentFilter = {};

	if (department) {
		return RocketChat.models.LivechatDepartmentAgents.getNextAgentForDepartment(department);
	} else {
		return RocketChat.models.Users.getNextAgent();
	}
};
