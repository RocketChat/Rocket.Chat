import { Template } from 'meteor/templating';

Template.messageAction.helpers({
	isButton() {
		return this.type === 'button';
	},
	areButtonsHorizontal() {
		return Template.parentData(1).button_alignment === 'horizontal';
	},
});
