RocketChat.Migrations.add
	version: 32
	up: ->
		RocketChat.models.Settings.update {'_id':/Accounts_OAuth_Custom_/}, {$set:{'group':'OAuth'}}, {multi: true}
