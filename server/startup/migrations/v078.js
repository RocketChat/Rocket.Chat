RocketChat.Migrations.add({
	version: 78,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Users) {
			RocketChat.models.Users.update({ newMessageNotification: false }, { $set: { newMessageNotification: 'none' } }, { multi: true });
			RocketChat.models.Users.update({ newMessageNotification: true }, { $unset: { newMessageNotification: 1 } }, { multi: true });
			RocketChat.models.Users.update({ newRoomNotification: false }, { $set: { newRoomNotification: 'none' } }, { multi: true });
			RocketChat.models.Users.update({ newRoomNotification: true }, { $unset: { newRoomNotification: 1 } }, { multi: true });
		}
	}
});
