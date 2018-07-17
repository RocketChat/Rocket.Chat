Template.messagePopupChannel.helpers({
	channelIcon() {
		return RocketChat.roomTypes.getIcon(this.t);
	}
});
