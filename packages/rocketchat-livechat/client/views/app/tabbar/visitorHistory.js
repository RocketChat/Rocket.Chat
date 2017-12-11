import moment from 'moment';

Template.visitorHistory.helpers({
	historyLoaded() {
		return !Template.instance().loadHistory.ready();
	},

	previousChats() {
		return ChatRoom.find({
			_id: { $ne: this.rid },
			'v._id': Template.instance().visitorId.get()
		}, {
			sort: {
				ts: -1
			}
		});
	},

	title() {
		let title = moment(this.ts).format('L LTS');

		if (this.label) {
			title += ` - ${ this.label }`;
		}

		return title;
	}
});

Template.visitorHistory.onCreated(function() {
	const currentData = Template.currentData();
	this.visitorId = new ReactiveVar();

	this.autorun(() => {
		const room = ChatRoom.findOne({ _id: Template.currentData().rid });
		this.visitorId.set(room.v._id);
	});

	if (currentData && currentData.rid) {
		this.loadHistory = this.subscribe('livechat:visitorHistory', { rid: currentData.rid });
	}
});
