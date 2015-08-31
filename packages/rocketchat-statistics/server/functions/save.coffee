RocketChat.statistics.save = ->
	statistics = RocketChat.statistics.get()
	statistics.createdAt = new Date
	Statistics.insert statistics
	return statistics

