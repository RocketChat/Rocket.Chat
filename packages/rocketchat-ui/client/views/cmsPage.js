Template.cmsPage.onCreated(function() {
	this.page = new ReactiveVar('');
	return Meteor.autorun((function(_this) {
		return function() {
			if (Session.get('cmsPage') != null) {
				return _this.page.set(RocketChat.settings.get(Session.get('cmsPage')));
			}
		};
	})(this));
});

Template.cmsPage.helpers({
	page() {
		return Template.instance().page.get();
	}
});

Template.cmsPage.events({
	'click .cms-page-close'() {
		return FlowRouter.go('/');
	}
});

Template.cmsPage.onRendered(function() {
	return $('#initial-page-loading').remove();
});
