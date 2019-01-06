import { registerFieldTemplate } from 'meteor/rocketchat:message-attachments';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';

Template.LastMessageAge.helpers({
	lastMessageAge() {
		const lastMessageTimestamp = Template.instance().data.field.lm;
		return moment(lastMessageTimestamp).fromNow();
	},
});

registerFieldTemplate('lastMessageAge', 'LastMessageAge', {});
