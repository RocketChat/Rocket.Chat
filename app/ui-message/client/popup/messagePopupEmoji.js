import { Template } from 'meteor/templating';
import './messagePopupEmoji.html';

Template.messagePopupEmoji.helpers({
	value() {
		const { length } = this.data;
		return this.data[length - 1];
	},
});
