import { Statistics } from '../../../models';
import { statistics } from '../statisticsNamespace';

statistics.save = function() {
	const rcStatistics = statistics.get();
	rcStatistics.createdAt = new Date();

	// Check if there's partial data already saved for the day
	const oldStats = Statistics.findLast();
	const now = new Date();
	const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, now.getHours(), now.getMinutes());

	if (oldStats && oldStats.partial && oldStats.createdAt >= yesterday) {
		if (oldStats.connectedUserCountList && oldStats.connectedUserCountList.length) {
			rcStatistics.avgConnectedUsers = oldStats.connectedUserCountList.reduce((total, value) => total + value) / oldStats.connectedUserCountList.length;
		} else {
			rcStatistics.avgConnectedUsers = 0;
		}

		delete oldStats.connectedUserCountList;

		rcStatistics.totalConnectedUsers = oldStats.totalConnectedUsers || 0;
		rcStatistics.minConnectedUsers = oldStats.minConnectedUsers;
		rcStatistics.onlineUsers = oldStats.onlineUsers || 0;
		rcStatistics.awayUsers = oldStats.awayUsers || 0;
		rcStatistics.offlineUsers = oldStats.offlineUsers;

		Statistics.update(oldStats._id, rcStatistics);
	} else {
		rcStatistics._id = now.toISOString().substr(0, 10);
		Statistics.insert(rcStatistics);
	}

	return rcStatistics;
};

statistics.saveUsersInfo = function() {
	const userStatistics = statistics.getConnectedUsersStatistics();

	const rcStatistics = Statistics.findLast();
	if (!rcStatistics || !rcStatistics.partial) {
		const statistics = userStatistics;

		statistics.partial = true;
		statistics.connectedUserCountList = [
			userStatistics.totalConnectedUsers,
		];
		statistics.createdAt = new Date();
		statistics._id = new Date().toISOString().substr(0, 10);

		Statistics.insert(statistics);
		return;
	}

	const data = {
		$max: {
			onlineUsers: userStatistics.onlineUsers,
			awayUsers: userStatistics.awayUsers,
			totalConnectedUsers: userStatistics.totalConnectedUsers,
		},
		$min: {
			offlineUsers: userStatistics.offlineUsers,
			minConnectedUsers: userStatistics.totalConnectedUsers,
		},
		$push: {
			connectedUserCountList: userStatistics.totalConnectedUsers,
		},
	};

	Statistics.update(rcStatistics._id, data);
};
