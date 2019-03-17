import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import './pageNotFound.html';

Template.pageNotFound.helpers({
	errorcode: function () {
		return '#404';
	}
});
