Template.header.helpers({
	isChannel() {
		return Template.instance().currentChannel != null;
	}
});

Template.header.onCreated(function() {
	this.currentChannel = RocketChat.models.Rooms.findOne(this.data._id);
});

