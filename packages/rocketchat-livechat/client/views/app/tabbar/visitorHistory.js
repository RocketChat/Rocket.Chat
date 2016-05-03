Template.visitorHistory.helpers({
	historyLoaded() {
		return !Template.instance().loadHistory.ready();
	},

	previousChats() {
		return ChatRoom.find({
			_id: { $ne: this.rid },
			'v.token': Template.instance().visitorToken.get()
		}, {
			sort: {
				ts: -1
			}
		});
	},

	date() {
		return moment(this.ts).format('L LTS');
	}
});

Template.visitorHistory.onCreated(function() {
	var currentData = Template.currentData();
	this.visitorToken = new ReactiveVar();

	this.autorun(() => {
		const room = ChatRoom.findOne({ _id: Template.currentData().rid });
		this.visitorToken.set(room.v.token);
	});

	if (currentData && currentData.rid) {
		this.loadHistory = this.subscribe('livechat:visitorHistory', currentData.rid);
	}
});
