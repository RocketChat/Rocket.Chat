Meteor.startup ->
	Meteor.defer ->
		if not Migrations? then return
		if Migrations.getVersion() isnt 0
			Migrations.migrateTo 'latest'
		else
			control = Migrations._getControl()
			control.version = _.last(Migrations._list).version
			Migrations._setControl control
