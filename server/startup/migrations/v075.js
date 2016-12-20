RocketChat.Migrations.add({
	version: 75,
	up: function() {
		ServiceConfiguration.configurations.remove({});
	}
});
