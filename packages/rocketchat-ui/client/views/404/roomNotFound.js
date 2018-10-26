import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

Template.roomNotFound.helpers({
	data() {
		return Session.get('roomNotFound');
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
});
