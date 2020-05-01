import moment from 'moment';
import './chatRoomSearchItem.html';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.chatRoomSearchItem.helpers({
	time() {
		const { ts } = Template.instance().room.get();
		return moment(ts).format('LT');
	},
});

Template.chatRoomSearchItem.onCreated(function() {
	this.room = new ReactiveVar();
	this.autorun(() => {
		this.room.set(Template.currentData());
	});
});
