import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.pageNotFound.helpers({
	errorcode: function () {
		return '#404';
	}
});
