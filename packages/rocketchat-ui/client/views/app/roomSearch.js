Template.roomSearch.helpers({
	roomIcon() {
		if (this.type === 'u') {
			return 'icon-at';
		}
		if (this.type === 'r') {
			return RocketChat.roomTypes.getIcon(this.t);
		}
	},
	userStatus() {
		if (this.type === 'u') {
			return `status-${ this.status }`;
		}
	}
});
