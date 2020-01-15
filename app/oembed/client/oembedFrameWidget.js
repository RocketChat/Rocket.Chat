import { Template } from 'meteor/templating';

Template.oembedFrameWidget.helpers({
	collapsed() {
		return this.collapsedMedia;
	},
});
