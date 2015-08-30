timer = undefined
updateServices = ->
	Meteor.clearTimeout timer if timer?

	timer = Meteor.setTimeout ->
		services = Settings.find({_id: /^Accounts_OAuth_[a-z]+$/i}).fetch()

		for service in services
			console.log "Updating login service #{service._id}".blue

			serviceName = service._id.replace('Accounts_', '')

			if serviceName is 'Meteor'
				serviceName = 'meteor-developer'

			if service.value is true
				if /Accounts_Custom/.test service._id
					serviceName = service._id.replace('Accounts_Custom', '')
					new CustomOAuth serviceName.toLowerCase(),
						serverURL: Settings.findOne({_id: "#{service._id}_URL"})?.value

				data =
					clientId: Settings.findOne({_id: "#{service._id}_id"})?.value
					secret: Settings.findOne({_id: "#{service._id}_secret"})?.value

				if serviceName is 'Facebook'
					data.appId = data.clientId
					delete data.clientId

				if serviceName is 'Twitter'
					data.consumerKey = data.clientId
					delete data.clientId

				ServiceConfiguration.configurations.upsert {service: serviceName.toLowerCase()}, $set: data
			else
				ServiceConfiguration.configurations.remove {service: serviceName.toLowerCase()}
	, 2000

Settings.find().observe
	added: (record) ->
		if /^Accounts_OAuth_.+/.test record._id
			updateServices()

	changed: (record) ->
		if /^Accounts_OAuth_.+/.test record._id
			updateServices()

	removed: (record) ->
		if /^Accounts_OAuth_.+/.test record._id
			updateServices()
