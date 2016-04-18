# Config and Start SyncedCron
logger = new Logger 'SyncedCron'

SyncedCron.config
	logger: (opts) ->
		logger[opts.level].call(logger, opts.message)
	collectionName: 'rocketchat_cron_history'

generateStatistics = ->
	statistics = RocketChat.statistics.save()
	statistics.host = Meteor.absoluteUrl()
	unless RocketChat.settings.get 'Statistics_opt_out'
		HTTP.post 'https://rocket.chat/stats',
			data: statistics
	return

Meteor.startup ->
	Meteor.defer ->
		generateStatistics()

		# Generate and save statistics every hour
		SyncedCron.add
			name: 'Generate and save statistics',
			schedule: (parser) -># parser is a later.parse object
				return parser.text 'every 1 hour'
			job: generateStatistics

		SyncedCron.start()
