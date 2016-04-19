RocketChat.Migrations.add({
	version: 45,
	up: function() {

		// finds the latest created visitor
		var lastVisitor = RocketChat.models.Users.find({ type: 'visitor' }, { fields: { username: 1 }, sort: { createdAt: -1 }, limit: 1 }).fetch();

		if (lastVisitor && lastVisitor.length > 0) {
			var lastNumber = lastVisitor[0].username.replace(/^guest\-/, '');

			RocketChat.settings.add('Livechat_guest_count' , (parseInt(lastNumber) + 1), { type: 'int', group: 'Livechat' });
		}
	}
});
