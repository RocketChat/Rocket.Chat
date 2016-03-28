/* exported getNextAgent */

this.getNextAgent = function(department) {
	if (department) {
		return RocketChat.models.LivechatDepartmentAgents.getNextAgentForDepartment(department);
	} else {
		return RocketChat.models.Users.getNextAgent();
	}
};
