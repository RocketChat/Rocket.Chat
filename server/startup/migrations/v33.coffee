RocketChat.Migrations.add
	version: 33
	up: ->
		scriptAlert = "/**\n * This scrit is out-of-date, convert to the new format\n * (https://github.com/RocketChat/Rocket.Chat/wiki/WebHook-Scripting)\n**/\n\n"

		integrations = RocketChat.models.Integrations.find({
			$or: [
				{script: {$exists: false}, processIncomingRequestScript: {$exists: true}}
				{script: {$exists: false}, prepareOutgoingRequestScript: {$exists: true}}
				{script: {$exists: false}, processOutgoingResponseScript: {$exists: true}}
			]
		}).fetch()


		integrations.forEach (integration) ->
			script = integration.processIncomingRequestScript or integration.prepareOutgoingRequestScript or integration.processOutgoingResponseScript
			RocketChat.models.Integrations.update integration._id,
				$set:
					script: scriptAlert + script.replace(/^/gm, '// ')


		update =
			$unset:
				processIncomingRequestScript: 1
				prepareOutgoingRequestScript: 1
				processOutgoingResponseScript: 1

		RocketChat.models.Integrations.update {}, update, {multi: true}
