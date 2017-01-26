RocketChat.Migrations.add({
	version: 83,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Users) {
			RocketChat.models.Users.update({ username: 'Rocket.Cat' }, { $set: { username: 'rocket.cat' } });
		}
		if (RocketChat && RocketChat.models && RocketChat.models.Messages) {
			RocketChat.models.Messages.update({ 'editedBy.username': 'Rocket.Cat' }, { $set: { 'editedBy.username': 'rocket.cat' } });
			RocketChat.models.Messages.update({ 'mentions.username': 'Rocket.Cat' }, { $set: { 'mentions.$.username': 'rocket.cat' } });
		}
		if (RocketChat && RocketChat.models && RocketChat.models.Rooms) {
			RocketChat.models.Rooms.update({ 'usernames': 'Rocket.Cat' }, { $set: { 'usernames.$': 'rocket.cat' } });
			RocketChat.models.Rooms.update({ 'muted': 'Rocket.Cat' }, { $set: { 'muted.$': 'rocket.cat' } });
			RocketChat.models.Rooms.update({ 'u.username': 'Rocket.Cat' }, { $set: { 'u.username': 'rocket.cat' } });
		}
		if (RocketChat && RocketChat.models && RocketChat.models.Subscriptions) {
			RocketChat.models.Subscriptions.update({ 'u.username': 'Rocket.Cat' }, { $set: { 'u.username': 'rocket.cat' } });
			RocketChat.models.Subscriptions.update({ 'type': 'd', 'name': 'Rocket.Cat' }, { $set: { 'name': 'rocket.cat' } });
		}
	}
});
