RocketChat.Migrations.add({
	version: 71.1,
	up: function() {
		ServiceConfiguration.configurations.remove({});
	}
});
