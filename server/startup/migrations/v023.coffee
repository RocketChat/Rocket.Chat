RocketChat.Migrations.add
	version: 23
	up: ->
		RocketChat.models.Settings.remove { _id: 'Accounts_denyUnverifiedEmails' }
		console.log 'Deleting not used setting Accounts_denyUnverifiedEmails'
