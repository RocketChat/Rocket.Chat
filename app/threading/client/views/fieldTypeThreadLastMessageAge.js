import { registerFieldTemplate } from 'meteor/rocketchat:message-attachments';
import { Template } from 'meteor/templating';
import moment from 'moment';

Template.LastMessageAge.helpers({
	lastMessageAge() {
		const lastMessageTimestamp = Template.instance().data.field.lm;
		return lastMessageTimestamp && moment(lastMessageTimestamp).format('LLL');
	},
});

registerFieldTemplate('lastMessageAge', 'LastMessageAge', {});
