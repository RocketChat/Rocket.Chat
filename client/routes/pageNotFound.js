import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import './pageNotFound.html';

Template.pageNotFound.onRendered(function() {
	const parent = document.querySelector('.page-loading');
	const child = document.querySelector('.loading-animation');
	parent.removeChild(child);
});

Template.pageNotFound.events({
	'click .page-not-found-button-home'(e) {
		e.preventDefault();
		FlowRouter.go('home');
	},

	'click .page-not-found-button-previous'(e) {
		e.preventDefault();
		window.history.back();
	},
});
