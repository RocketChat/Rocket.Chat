Meteor.startup ->
	Migrations.migrateTo 'latest'