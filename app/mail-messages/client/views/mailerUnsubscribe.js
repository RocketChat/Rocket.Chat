import { Template } from 'meteor/templating';

Template.mailerUnsubscribe.onRendered(function() {
	return $('#initial-page-loading').remove();
});
