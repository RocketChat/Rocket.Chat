RocketChat.statistics.save = function() {
	const statistics = RocketChat.statistics.get();
	statistics.createdAt = new Date;
	RocketChat.models.Statistics.insert(statistics);
	return statistics;
};
