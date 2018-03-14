import moment from 'moment';

Template.visitorNavigation.helpers({
	loadingNavigation() {
		return !Template.instance().pageVisited.ready();
	},

	pages() {
		const room = ChatRoom.findOne({ _id: this.rid }, { fields: { 'v.token': 1 } });

		if (room) {
			return LivechatMessage.find({rid: room._id, t: 'livechat_navigation_history'}, { sort: { ts: -1 } });
		}
	},

	pageTitle() {
		return this.navigation.page.title || t('Empty_title');
	},

	accessDateTime() {
		return moment(this.ts).format('L LTS');
	}
});

Template.visitorNavigation.onCreated(function() {
	const currentData = Template.currentData();

	if (currentData && currentData.rid) {
		this.pageVisited = this.subscribe('livechat:visitorPageVisited', { rid: currentData.rid });
	}
});
