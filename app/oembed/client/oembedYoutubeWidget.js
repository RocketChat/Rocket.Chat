import { Template } from 'meteor/templating';

Template.oembedYoutubeWidget.helpers({
	collapsed() {
		return this.collapsedMedia;
	},
});
