import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './messageBoxPreview.html';

Template.messageBoxPreview.helpers({
	showMessagePreview() {
		return Template.instance().popupConfig.get();
	},
});

Template.messageBoxPreview.events({
	'click .cancel-preview'(e, t) {
		e.preventDefault();
		e.stopPropagation();

		t.popupConfig.set(false);
	},
});

Template.messageBoxPreview.onCreated(function() {
	this.popupConfig = new ReactiveVar(true);
});
