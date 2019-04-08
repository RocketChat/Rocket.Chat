/* eslint-disable no-unused-vars,new-cap */
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { WordCloud } from 'meteor/overture8:wordcloud2';

function drawWords() {
	const instance = Template.instance();
	// properties.setCanvas(instance.canvasToDraw.get());
	window.WordCloud(instance.canvasToDraw.get(), instance.data.properties);
}

Template.ChannelSelection.events({
	'click .full-modal__back-button'(event, instance) {
		instance.data.hideMe();
	},
});

Template.ChannelSelection.helpers({
	// To Do
});

Template.ChannelSelection.onRendered(function() {
	const canvasToDraw = this.find('[id="wc-canvas"]');
	if (canvasToDraw) {
		canvasToDraw.width = 1200;
		canvasToDraw.height = 800;
		this.canvasToDraw.set(canvasToDraw);
		drawWords();
	}
});

Template.ChannelSelection.onCreated(function() {
	this.canvasToDraw = new ReactiveVar('');
});
