if RocketChat.Migrations.getVersion() isnt 0
	RocketChat.Migrations.migrateTo 'latest'
else
	control = RocketChat.Migrations._getControl()
	control.version = _.last(RocketChat.Migrations._list).version
	RocketChat.Migrations._setControl control
