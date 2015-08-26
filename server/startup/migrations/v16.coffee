Meteor.startup ->
	Migrations.add
		version: 16
		up: ->
            Settings.insert { _id: 'Site_Name', value: 'Rocket.Chat', type: 'string', group: 'General' } if Settings.get 'Site_Name'?
            
