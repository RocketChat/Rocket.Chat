import { Template } from 'meteor/templating';

Template.messageAttachment.helpers({

	getImageHeight(height = 200) {
		return height;
	},
});
