RocketChat.getStatistics = ->
	statistics = {}
	
	# Version
	statistics.version = BuildInfo?.commit?.hash
	statistics.versionDate = BuildInfo?.commit?.date

	# User statistics
	statistics.totalUsers = Meteor.users.find().count()
	statistics.activeUsers = Meteor.users.find({ active: true }).count()
	statistics.nonActiveUsers = statistics.totalUsers - statistics.activeUsers
	statistics.onlineUsers = Meteor.users.find({ statusConnection: 'online' }).count()
	statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers

	# Room statistics
	statistics.totalRooms = ChatRoom.find().count()
	statistics.totalChannels = ChatRoom.find({ t: 'c' }).count()
	statistics.totalPrivateGroups = ChatRoom.find({ t: 'p' }).count()
	statistics.totalDirect = ChatRoom.find({ t: 'd' }).count()

	m = ->
		emit 1, 
			sum: this.usernames.length or 0
			min: this.usernames.length or 0
			max: this.usernames.length or 0
			count: 1

		emit this.t,
			sum: this.usernames.length or 0
			min: this.usernames.length or 0
			max: this.usernames.length or 0
			count: 1

	r = (k, v) ->
		a = v.shift()
		for b in v
			a.sum += b.sum
			a.min = Math.min a.min, b.min
			a.max = Math.max a.max, b.max
			a.count += b.count
		return a
	
	f = (k, v) ->
		v.avg = v.sum / v.count
		return v

	result = ChatRoom.mapReduce(m, r, { finalize: f, out: "rocketchat_mr_statistics" })

	statistics.maxRoomUsers = MapReducedStatistics.findOne({ _id: 1 }).value.max
	statistics.avgChannelUsers = MapReducedStatistics.findOne({ _id: 'c' }).value.avg
	statistics.avgPrivateGroupUsers = MapReducedStatistics.findOne({ _id: 'p' }).value.avg
	
	os = Npm.require('os')
	statistics.os = 
		type: os.type()
		platform: os.platform()
		arch: os.arch()
		release: os.release()
		uptime: os.uptime()
		loadavg: os.loadavg()
		totalmem: os.totalmem()
		freemem: os.freemem()
		cpus: os.cpus()

	return statistics