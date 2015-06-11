Meteor.startup ->
	Meteor.defer ->
		Migrations.migrateTo 'latest'
