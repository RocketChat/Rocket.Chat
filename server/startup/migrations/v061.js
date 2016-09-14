RocketChat.Migrations.add({
	version: 61,
	up: function() {
        RocketChat.models.Users.find({}).forEach((user) => {
            RocketChat.models.Messages.update({'u._id': user._id}, {$set: { 'u.name': user.name }}, {multi: true});
        });
	}
});
