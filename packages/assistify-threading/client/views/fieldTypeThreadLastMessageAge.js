import { registerFieldTemplate } from 'meteor/rocketchat:message-attachments';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';

Template.LastMessageAge.helpers({
	lastMessageAge() {
		const lastMessageTimestamp = Template.instance().lastMessageTimestamp.get();
		return moment(lastMessageTimestamp).fromNow();
	},
});

Template.LastMessageAge.onCreated(function() {
	this.lastMessageTimestamp = new ReactiveVar(new Date('2018-12-19 13:15:00'));

	Meteor.call('getRoomMessageMetadata', this.data.field.roomId, (err, metadata) => {
		const { lastMessageTimestamp } = metadata;

		if (!err) {
			this.lastMessageTimestamp.set(lastMessageTimestamp);
		}
	});
});

registerFieldTemplate('lastMessageAge', 'LastMessageAge', {});
