RocketChat.statistics = {};
RocketChat.statistics.loadTimestamp = new Date();

Meteor.call('getStatistics', true, function(error, statistics) {
	statistics.loadTimestamp = RocketChat.statistics.loadTimestamp;
	RocketChat.statistics = statistics;
});
