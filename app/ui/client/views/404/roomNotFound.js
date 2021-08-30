import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';

Template.roomNotFound.helpers({
	data() {
		return Template.currentData();
	},
	name() {
		return Blaze._escape(this.name);
	},
	sameUser() {
		const user = Meteor.user();
		return user && user.username === this.name;
	},
	hasCustomErrorData() {
		return this.error && this.error.error && this.error.reason && this.error.error !== 'error-invalid-user';
	},
	customErrorMessage() {
		return this.error.reason;
	},
	headerMessage() {
		const { type } = Template.currentData();

		return type === 'd' ? 'User_not_found' : 'Room_not_found';
	},
});
