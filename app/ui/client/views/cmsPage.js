import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

import { settings } from '../../../settings';

Template.cmsPage.onCreated(function() {
	this.page = new ReactiveVar('');

	this.autorun(() => {
		const { cmsPage } = Template.currentData();
		if (cmsPage) {
			this.page.set(settings.get(cmsPage));
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
		FlowRouter.go('/');
	},
});
