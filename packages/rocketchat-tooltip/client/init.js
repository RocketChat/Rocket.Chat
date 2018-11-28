import { Template } from 'meteor/templating';

Template.main.onCreated(function() {
	RocketChat.tooltip.init();
});
