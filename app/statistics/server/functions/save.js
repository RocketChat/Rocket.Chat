import { Statistics } from '../../../models';
import { statistics } from '../statisticsNamespace';

statistics.save = function() {
	const rcStatistics = statistics.get();
	rcStatistics.createdAt = new Date();

	const now = new Date();
	const newId = now.toISOString().substr(0, 10);
	const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
	const yesterdayPartialId = `${ yesterday.toISOString().substr(0, 10) }-partial`;
	const yesterdayData = Statistics.findOneById(yesterdayPartialId);

	if (yesterdayData) {
		const userCountList = yesterdayData.connectedUserCountList;

		if (userCountList && userCountList.length) {
			rcStatistics.avgConnectedUsers = userCountList.reduce((total, value) => total + value) / userCountList.length;
		} else {
			rcStatistics.avgConnectedUsers = null;
		}

		rcStatistics.totalConnectedUsers = yesterdayData.totalConnectedUsers || 0;
		rcStatistics.minConnectedUsers = yesterdayData.minConnectedUsers;
		rcStatistics.onlineUsers = yesterdayData.onlineUsers || 0;
		rcStatistics.awayUsers = yesterdayData.awayUsers || 0;
		rcStatistics.offlineUsers = yesterdayData.offlineUsers;
	}

	const existingData = Statistics.findOneById(newId);

	if (existingData) {
		Statistics.update(newId, rcStatistics);
		return rcStatistics;
	}

	rcStatistics._id = newId;
	Statistics.insert(rcStatistics);

	if (yesterdayData) {
		Statistics.remove({
			_id: yesterdayPartialId,
		});
	}

	return rcStatistics;
};

statistics.saveUsersInfo = function() {
	const userStatistics = statistics.getConnectedUsersStatistics();

	const now = new Date();
	const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
	const yesterdayPartialId = `${ yesterday.toISOString().substr(0, 10) }-partial`;
	const yesterdayData = Statistics.findOneById(yesterdayPartialId);

	if (!yesterdayData) {
		const statistics = userStatistics;
		statistics.connectedUserCountList = [
			userStatistics.totalConnectedUsers,
		];
		statistics.minConnectedUsers = userStatistics.totalConnectedUsers;
		statistics.createdAt = new Date();
		statistics._id = yesterdayPartialId;

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

	Statistics.update(yesterdayData._id, data);
};
