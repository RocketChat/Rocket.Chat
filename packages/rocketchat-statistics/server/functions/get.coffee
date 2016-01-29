RocketChat.statistics.get = ->
	statistics = {}

	# Version
	statistics.uniqueId = RocketChat.settings.get("uniqueID")
	statistics.createdAt = RocketChat.models.Settings.findOne("uniqueID")?._createdAt
	statistics.version = RocketChat.Info?.version
	statistics.tag = RocketChat.Info?.tag
	statistics.branch = RocketChat.Info?.branch

	# User statistics
	statistics.totalUsers = Meteor.users.find().count()
	statistics.activeUsers = Meteor.users.find({ active: true }).count()
	statistics.nonActiveUsers = statistics.totalUsers - statistics.activeUsers
	statistics.onlineUsers = Meteor.users.find({ statusConnection: 'online' }).count()
	statistics.awayUsers = Meteor.users.find({ statusConnection: 'away' }).count()
	statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers - statistics.awayUsers

	# Room statistics
	statistics.totalRooms = RocketChat.models.Rooms.find().count()
	statistics.totalChannels = RocketChat.models.Rooms.findByType('c').count()
	statistics.totalPrivateGroups = RocketChat.models.Rooms.findByType('p').count()
	statistics.totalDirect = RocketChat.models.Rooms.findByType('d').count()

	# Message statistics
	statistics.totalMessages = RocketChat.models.Messages.find().count()

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

	result = RocketChat.models.Rooms.model.mapReduce(m, r, { finalize: f, out: "rocketchat_mr_statistics" })

	statistics.maxRoomUsers = 0
	statistics.avgChannelUsers = 0
	statistics.avgPrivateGroupUsers = 0

	if RocketChat.models.MRStatistics.findOneById(1)
		statistics.maxRoomUsers = RocketChat.models.MRStatistics.findOneById(1).value.max

	if RocketChat.models.MRStatistics.findOneById('c')
		statistics.avgChannelUsers = RocketChat.models.MRStatistics.findOneById('c').value.avg

	if RocketChat.models.MRStatistics.findOneById('p')
		statistics.avgPrivateGroupUsers = RocketChat.models.MRStatistics.findOneById('p').value.avg

	statistics.lastLogin = RocketChat.models.Users.getLastLogin()
	statistics.lastMessageSentAt = RocketChat.models.Messages.getLastTimestamp()
	statistics.lastSeenSubscription = RocketChat.models.Subscriptions.getLastSeen()

	migration = Migrations?._getControl()
	if migration
		statistics.migration = _.pick(migration, 'version', 'locked')

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

	statistics.process =
		nodeVersion: process.version
		pid: process.pid
		uptime: process.uptime()

	statistics.migration = RocketChat.Migrations._getControl()

	statistics.instanceCount = InstanceStatus.getCollection().find().count()

	return statistics
