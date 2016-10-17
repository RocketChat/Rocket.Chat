RocketChat.statistics.get = ->
	statistics = {}

	# Version
	statistics.uniqueId = RocketChat.settings.get("uniqueID")
	statistics.installedAt = RocketChat.models.Settings.findOne("uniqueID")?.createdAt
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
