import { Template } from 'meteor/templating';

Template.messagePopupEmoji.helpers({
	value() {
		const { length } = this.data;
		return this.data[length - 1];
	},
});
