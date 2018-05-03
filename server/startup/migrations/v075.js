RocketChat.Migrations.add({
	version: 71.1,
	up() {
		ServiceConfiguration.configurations.remove({});
	}
});

RocketChat.Migrations.add({
	version: 75,
	up() {
		ServiceConfiguration.configurations.remove({});
	}
});

