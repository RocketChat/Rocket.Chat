timer = undefined
updateServices = ->
	Meteor.clearTimeout timer if timer?

	timer = Meteor.setTimeout ->
		console.log 'Updating login services'.blue
		services =
			'facebook': 'Facebook'
			'google': 'Google'
			'github': 'Github'
			'gitlab': 'Gitlab'
			'linkedin': 'Linkedin'
			'meteor-developer': 'Meteor'
			'twitter': 'Twitter'

		for serviceName, settingName of services
			enable = Settings.findOne _id: "Accounts_#{settingName}", value: true
			if enable?
				data =
					clientId: Settings.findOne({_id: "Accounts_#{settingName}_id"})?.value
					secret: Settings.findOne({_id: "Accounts_#{settingName}_secret"})?.value

				if serviceName is 'facebook'
					data.appId = data.clientId
					delete data.clientId

				if serviceName is 'twitter'
					data.consumerKey = data.clientId
					delete data.clientId

				ServiceConfiguration.configurations.upsert {service: serviceName}, $set: data
			else
				ServiceConfiguration.configurations.remove {service: serviceName}
	, 2000

Settings.find().observe
	added: (record) ->
		if /^Accounts_.+/.test record._id
			updateServices()

	changed: (record) ->
		if /^Accounts_.+/.test record._id
			updateServices()

	removed: (record) ->
		if /^Accounts_.+/.test record._id
			updateServices()
