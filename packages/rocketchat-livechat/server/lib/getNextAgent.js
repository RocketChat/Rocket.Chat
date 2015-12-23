this.getNextAgent = function(department) {
	var agentFilter = {};

	if (department) {
		return RocketChat.models.LivechatDepartment.getNextAgent(department);
	} else {
		return RocketChat.models.Users.getNextAgent();
	}
};
