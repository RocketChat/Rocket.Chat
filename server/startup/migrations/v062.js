RocketChat.Migrations.add({
	version: 62,
	up: function() {
		RocketChat.models.Settings.remove({ _id: 'Atlassian Crowd', type: 'group' });
	}
});
