import { Template } from 'meteor/templating';

import './pageNotFound.html';

Template.pageNotFound.helpers({
	errorcode() {
		return '404';
	},
});
