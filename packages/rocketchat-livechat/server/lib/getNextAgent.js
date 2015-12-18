this.getNextAgent = function(department) {
	var agentFilter = {};

	// find agents from that department
	if (department) {
		var agents = RocketChat.models.LivechatDepartment.getNextAgent(department);

		if (!agents) {
			return;
		}

		// sort = {
		// 	count: 1,
		// 	order: 1,
		// 	'user.name': 1
		// }

		// update = {
		// 	$inc: {
		// 		count: 1
		// 	}
		// }

		// queueUser = findAndModify query, sort, update
	} else {
		return RocketChat.models.Users.getNextAgent();
	}
};
