# Config and Start SyncedCron
SyncedCron.config
	collectionName: 'rocketchat_cron_history'

Meteor.startup ->
	Meteor.defer ->

		# Generate and save statistics every hour
		SyncedCron.add
			name: 'Generate and save statistics',
			schedule: (parser) -># parser is a later.parse object
				return parser.text 'every 1 hour'
			job: ->
				statistics = RocketChat.saveStatistics()
				return

		unless RocketChat.settings.get 'Statistics_opt_out'
			# Generate and save statistics every hour
			SyncedCron.add
				name: 'Send statistics to Rocket.Chat',
				schedule: (parser) -># parser is a later.parse object
					return parser.text 'every 1 day'
				job: ->
					statistics = RocketChat.getAvgStatistics()
					# HTTP.post 'http://localhost:3005/stats', 
					HTTP.post 'https://rocket.chat/stats', 
						data: statistics
					return

		SyncedCron.start()
