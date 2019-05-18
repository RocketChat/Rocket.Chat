import { Statistics } from '../../../models';
import { statistics } from '../statisticsNamespace';

statistics.save = function() {
	const rcStatistics = statistics.get();
	rcStatistics.createdAt = new Date();

	// Check if there's partial data already saved for the hour
	const oldStats = Statistics.findLast();
	if (oldStats) {
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
