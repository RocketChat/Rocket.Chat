Template.visitorNavigation.helpers({
	loadingNavigation() {
		return !Template.instance().pageVisited.ready();
	},

	pageVisited() {
		const room = ChatRoom.findOne({ _id: this.rid }, { fields: { 'v.token': 1 } });

		return LivechatPageVisited.find({ token: room.v.token }, { sort: { ts: -1 } });
	},

	pageTitle() {
		return this.page.title || t('Empty_title');
	},

	accessDateTime() {
		return moment(this.ts).format('L LTS');
	}
});

Template.visitorNavigation.onCreated(function() {
	var currentData = Template.currentData();

	if (currentData && currentData.rid) {
		this.pageVisited = this.subscribe('livechat:visitorPageVisited', currentData.rid);
	}
});
