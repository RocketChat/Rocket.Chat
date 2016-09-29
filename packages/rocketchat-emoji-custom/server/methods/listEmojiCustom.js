Meteor.methods({
	listEmojiCustom() {
		return RocketChat.models.EmojiCustom.find({}).fetch();
	}
});
