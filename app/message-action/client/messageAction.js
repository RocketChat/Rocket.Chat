import { Template } from 'meteor/templating';
import { HTTP } from 'meteor/http';

Template.messageAction.helpers({
	isButton() {
		return this.type === 'button';
	},
	areButtonsHorizontal() {
		return Template.parentData(1).button_alignment === 'horizontal';
	},
	jsActionButtonClassname(processingType) {
		return `js-actionButton-${ processingType || 'sendMessage' }`;
	},
	executeApiRequest() {
		const headers = { 'X-Auth-Token': localStorage.getItem('Meteor.loginToken'), 'X-User-Id': localStorage.getItem('Meteor.userId') };
		HTTP.get('/api/v1/statistics', { headers }, (err, response) => { console.log(err, response); });
	},
});
