RocketChat.Migrations.add({
	version: 71.1,
	up: function() {
		ServiceConfiguration.configurations.remove({});
	}
});

RocketChat.Migrations.add({
	version: 75,
	up: function() {
		ServiceConfiguration.configurations.remove({});
	}
});

