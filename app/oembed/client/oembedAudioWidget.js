import { Template } from 'meteor/templating';

Template.oembedAudioWidget.helpers({
	collapsed() {
		return this.collapsedMedia;
	},
});
