Meteor.startup ->
	Meteor.defer ->
		
		# Config and Start SyncedCron
		SyncedCron.config
			collectionName: 'rocketchat_cron_history'
		
		# Generate and save statistics every hour
		SyncedCron.add
			name: 'Generate and save statistics every hour',
			schedule: (parser) -># parser is a later.parse object
				return parser.text 'every 1 hours'
			job: ->
				statistics = RocketChat.saveStatistics
				return

		SyncedCron.start()
