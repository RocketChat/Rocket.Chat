Meteor.methods({
	listCustomSounds() {
		return RocketChat.models.CustomSounds.find({}).fetch();
	}
});
