Template.spotlightTemplate.helpers({
	icon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},

	userStatus() {
		if (this.t === 'd' || this.t === 'l') {
			return 'status-' + (Session.get(`user_${this.name}_status`) || 'offline');
		}
		return 'status-offline';
	}
});
