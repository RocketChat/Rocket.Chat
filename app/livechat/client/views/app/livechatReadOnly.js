import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Rooms } from '../../../../models';

Template.livechatReadOnly.helpers({
	roomClosed() {
		return Template.instance().roomClosed.get();
	},

	isInquiry() {

	},
});

Template.livechatReadOnly.onCreated(function() {
	this.rid = new ReactiveVar(null);
	this.roomClosed = new ReactiveVar(false);

	const currentData = Template.currentData();
	if (currentData && currentData.rid) {
		this.rid.set(currentData.rid);

		this.autorun(() => {
			const room = Rooms.findOne({ _id: currentData.rid });
			this.roomClosed.set(!(room && room.open && room.open === true));
		});
	}
});
