import { Template } from 'meteor/templating';
import { RocketChat } from 'meteor/rocketchat:lib';

Template.main.onCreated(function() {
	RocketChat.tooltip.init();
});
