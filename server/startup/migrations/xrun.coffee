Meteor.startup ->
	Meteor.defer ->
		if Migrations.getVersion() isnt 0
			Migrations.migrateTo 'latest'
		else
			control = Migrations._getControl()
			control.version = _.last(Migrations._list).version
			Migrations._setControl control
