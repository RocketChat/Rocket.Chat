import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';

Template.cmsPage.onCreated(function() {
	this.page = new ReactiveVar('');
	return Meteor.autorun(() => {
		const cmsPage = Session.get('cmsPage');
		if (cmsPage != null) {
			return this.page.set(RocketChat.settings.get(cmsPage));
		}
	});
});

Template.cmsPage.helpers({
	page() {
		return Template.instance().page.get();
	},
});

Template.cmsPage.events({
	'click .cms-page-close'() {
		return FlowRouter.go('/');
	},
});

Template.cmsPage.onRendered(function() {
	return $('#initial-page-loading').remove();
});
