RocketChat.statistics.getAverage = ->
	statistics = {}

	m = ->
		d = this.createdAt
		this.count = 1
		emit "#{d.getFullYear()}-#{d.getMonth()+1}-#{d.getDate()}", this

	r = (k, v) ->
		a = v.shift()
		for b in v
			a.count += b.count
			a.totalUsers += b.totalUsers
			a.activeUsers += b.activeUsers
			a.nonActiveUsers += b.nonActiveUsers
			a.onlineUsers += b.onlineUsers
			a.awayUsers += b.awayUsers
			a.offlineUsers += b.offlineUsers
			a.totalRooms += b.totalRooms
			a.totalChannels += b.totalChannels
			a.totalPrivateGroups += b.totalPrivateGroups
			a.totalDirect += b.totalDirect
			a.avgChannelUsers += b.avgChannelUsers
			a.avgPrivateGroupUsers += b.avgPrivateGroupUsers
			a.maxRoomUsers = Math.max a.maxRoomUsers, b.maxRoomUsers
			a.os.uptime += b.os.uptime
			a.os.totalmem += b.os.totalmem
			a.os.freemem += b.os.freemem
			a.os.loadavg[0] += b.os.loadavg[0]
			a.os.loadavg[1] += b.os.loadavg[1]
			a.os.loadavg[2] += b.os.loadavg[2]
		return a

	f = (k, v) ->
		out = {}
		out.totalUsers = v.totalUsers / v.count
		out.activeUsers = v.activeUsers / v.count
		out.nonActiveUsers = v.nonActiveUsers / v.count
		out.onlineUsers = v.onlineUsers / v.count
		out.awayUsers = v.awayUsers / v.count
		out.offlineUsers = v.offlineUsers / v.count
		out.totalRooms = v.totalRooms / v.count
		out.totalChannels = v.totalChannels / v.count
		out.totalPrivateGroups = v.totalPrivateGroups / v.count
		out.totalDirect = v.totalDirect / v.count
		out.avgChannelUsers = v.avgChannelUsers / v.count
		out.avgPrivateGroupUsers = v.avgPrivateGroupUsers / v.count
		out.maxRoomUsers = v.maxRoomUsers / v.count
		out.os = {}
		out.os.uptime = v.os.uptime / v.count
		out.os.totalmem = v.os.totalmem / v.count
		out.os.freemem = v.os.freemem / v.count
		out.os.loadavg = [ (v.os.loadavg[0] / v.count), (v.os.loadavg[1] / v.count), (v.os.loadavg[2] / v.count) ]
		return out

	result = RocketChat.models.Statistics.model.mapReduce(m, r, { finalize: f, out: "rocketchat_mr_statistics" })
	statistics = RocketChat.models.MRStatistics.find().fetch()
	return statistics
