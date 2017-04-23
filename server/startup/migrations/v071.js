RocketChat.Migrations.add({
	version: 71,
	up() {
		//Removes the reactions on messages which are the system type "rm" ;)
		RocketChat.models.Messages.find({ 't': 'rm', 'reactions': { $exists: true, $not: {$size: 0} } }, { t: 1 }).forEach(function(message) {
			RocketChat.models.Messages.update({ _id: message._id }, { $set: { reactions: [] }});
		});
	}
});
