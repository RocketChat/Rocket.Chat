import { Template } from 'meteor/templating';

import './pageNotFound.html';

Template.pageNotFound.helpers({
	errorcode() {
		return '404';
	},
});

Template.pageNotFound.onRendered(function() {
	const parent = document.querySelector('.page-loading');
	const child = document.querySelector('.loading-animation');
	parent.removeChild(child);
});

Template.pageNotFound.events({
	'click .page-not-found-button-home'(e) {
		e.preventDefault();
		window.location.href = '/';
	},

	'click .page-not-found-button-previous'(e) {
		e.preventDefault();
		window.history.back();
	},
});
