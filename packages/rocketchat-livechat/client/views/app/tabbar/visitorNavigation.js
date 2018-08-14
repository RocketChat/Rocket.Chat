import moment from 'moment';
const visitorNavigationHistory = new Mongo.Collection('visitor_navigation_history');

Template.visitorNavigation.helpers({
	loadingNavigation() {
		return !Template.instance().pageVisited.ready();
	},

	pages() {
		const room = ChatRoom.findOne({ _id: this.rid }, { fields: { 'v.token': 1 } });

		if (room) {
			return visitorNavigationHistory.find({ rid: room._id }, { sort: { ts: -1 } });
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
