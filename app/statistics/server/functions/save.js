import { Statistics } from '../../../models';
import { statistics } from '../statisticsNamespace';

statistics.save = function() {
	const rcStatistics = statistics.get();
	rcStatistics.createdAt = new Date();

	// Check if there's partial data already saved for the hour
	const existingStatistics = Statistics.findLast();
	if (existingStatistics) {
		rcStatistics.hourlyData = existingStatistics.hourlyData;

		Statistics.update(existingStatistics._id, rcStatistics);
	} else {
		Statistics.insert(rcStatistics);
	}

	return rcStatistics;
};

statistics.saveUsersInfo = function() {
	const connectedUsers = statistics.getConnectedUsers();

	const rcStatistics = Statistics.findLast();
	if (!rcStatistics || !rcStatistics.partial) {
		const statistics = {
			maxConnectedUsers: connectedUsers,
			minConnectedUsers: connectedUsers,
			partial: true,
			createdAt: new Date(),
		};

		Statistics.insert(statistics);
		return statistics;
	}

	if (rcStatistics.maxConnectedUsers != null) {
		rcStatistics.maxConnectedUsers = Math.max(rcStatistics.maxConnectedUsers, connectedUsers);
	} else {
		rcStatistics.maxConnectedUsers = connectedUsers;
	}

	if (rcStatistics.minConnectedUsers != null) {
		rcStatistics.minConnectedUsers = Math.min(rcStatistics.minConnectedUsers, connectedUsers);
	} else {
		rcStatistics.minConnectedUsers = connectedUsers;
	}

	Statistics.update(rcStatistics._id, rcStatistics);

	return rcStatistics;
};

statistics.compileHourlyUsersInfo = function() {
	const rcStatistics = Statistics.findLast();
	if (!rcStatistics || !rcStatistics.partial) {
		return;
	}

	const now = new Date();
	const hourTimeStamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

	if (!rcStatistics.hourlyData) {
		rcStatistics.hourlyData = {};
	}

	rcStatistics.hourlyData[hourTimeStamp] = {
		maxConnectedUsers: rcStatistics.maxConnectedUsers,
		minConnectedUsers: rcStatistics.minConnectedUsers,
	};

	rcStatistics.maxConnectedUsers = null;
	rcStatistics.minConnectedUsers = null;

	Statistics.update(rcStatistics._id, rcStatistics);
	return rcStatistics;
};
