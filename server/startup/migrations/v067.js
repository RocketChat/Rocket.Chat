RocketChat.Migrations.add({
	version: 67,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.LivechatDepartment) {
			RocketChat.models.LivechatDepartment.model.update({}, {
				$set: {
					showOnRegistration: true
				}
			}, { multi: true });
		}
	}
});
