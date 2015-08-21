RocketChat.saveStatistics = ->
	statistics = RocketChat.getStatistics()
	statistics.createdAt = new Date
	Statistics.insert statistics
	return statistics