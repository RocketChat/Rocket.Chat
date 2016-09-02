Meteor.methods({
	listCustomEmoji() {
		return RocketChat.models.CustomEmoji.find({}).fetch();
	}
});
