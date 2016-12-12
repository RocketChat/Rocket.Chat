RocketChat.Migrations.add({
	version: 58,
	up: function() {
		RocketChat.models.Settings.update({ _id: 'Push_gateway', value: 'https://rocket.chat' }, {
			$set: {
				value: 'https://gateway.rocket.chat',
				packageValue: 'https://gateway.rocket.chat'
			}
		});
	}
});
