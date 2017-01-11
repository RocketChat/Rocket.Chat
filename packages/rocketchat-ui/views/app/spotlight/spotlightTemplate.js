Template.spotlightTemplate.helpers({
	icon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},

	userStatus() {
		if (this.t === 'd') {
			return 'status-' + (Session.get(`user_${this.name}_status`) || 'offline');
		} else {
			return 'status-' + (RocketChat.roomTypes.getUserStatus(this.t, this.rid || this._id) || 'offline');
		}
	}
});
