RocketChat.Migrations.add
	version: 7
	up: ->

		console.log 'Populate urls in messages'
		query = RocketChat.models.Messages.find({ 'urls.0': { $exists: true } })
		count = query.count()
		query.forEach (message, index) ->
			console.log "#{index + 1} / #{count}"

			message.urls = message.urls.map (url) ->
				if _.isString url
					return {url: url}
				return url

			OEmbed.RocketUrlParser message

		console.log 'End'
