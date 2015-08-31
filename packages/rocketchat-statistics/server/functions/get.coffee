RocketChat.statistics.get = ->
	statistics = {}
	
	# Version
	statistics.uniqueId = Settings.findOne({ _id: "uniqueID" })?.value
	statistics.version = BuildInfo?.commit?.hash
	statistics.versionDate = BuildInfo?.commit?.date

	# User statistics
	statistics.totalUsers = Meteor.users.find().count()
	statistics.activeUsers = Meteor.users.find({ active: true }).count()
	statistics.nonActiveUsers = statistics.totalUsers - statistics.activeUsers
	statistics.onlineUsers = Meteor.users.find({ statusConnection: 'online' }).count()
	statistics.awayUsers = Meteor.users.find({ statusConnection: 'away' }).count()
	statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers - statistics.awayUsers

	# Room statistics
	statistics.totalRooms = ChatRoom.find().count()
	statistics.totalChannels = ChatRoom.find({ t: 'c' }).count()
	statistics.totalPrivateGroups = ChatRoom.find({ t: 'p' }).count()
	statistics.totalDirect = ChatRoom.find({ t: 'd' }).count()

	# Message statistics
	statistics.totalMessages = ChatMessage.find().count()

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

	statistics.maxRoomUsers = 0 
	statistics.avgChannelUsers = 0
	statistics.avgPrivateGroupUsers = 0

	if MapReducedStatistics.findOne({ _id: 1 })
		statistics.maxRoomUsers = MapReducedStatistics.findOne({ _id: 1 }).value.max
	else 
		console.log 'max room user statistic not found'.red

	if MapReducedStatistics.findOne({ _id: 'c' })
		statistics.avgChannelUsers = MapReducedStatistics.findOne({ _id: 'c' }).value.avg
	else
		console.log 'channel user statistic not found'.red

	if MapReducedStatistics.findOne({ _id: 'p' })
		statistics.avgPrivateGroupUsers = MapReducedStatistics.findOne({ _id: 'p' }).value.avg 
	else
		console.log 'private group user statistic not found'.red
	
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