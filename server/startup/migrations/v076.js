RocketChat.Migrations.add({
	version: 76,
	up() {
		if (RocketChat && RocketChat.models && RocketChat.models.Settings) {
			RocketChat.models.Settings.find({section: 'Colors (alphas)'}).forEach((setting) => {
				RocketChat.models.Settings.remove({ _id: setting._id });
			});
		}
	}
});
