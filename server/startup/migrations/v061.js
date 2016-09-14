RocketChat.Migrations.add({
	version: 61,
	up: function() {
        let users = RocketChat.models.Users.find({}, { name: 1 }).fetch().reduce((o, v, i) => {
            o[v._id] = v.name;
            return o;
        }, {});

        RocketChat.models.Messages.find({}).forEach((message) => {
            let name = users[message.u._id];
            RocketChat.models.Messages.update({_id: message._id}, {$set: { 'u.name': name }});
        });
	}
});
