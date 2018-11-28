import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

Template.appWhatIsIt.onCreated(function() {
	this.isLoading = new ReactiveVar(false);
	this.hasError = new ReactiveVar(false);
});

Template.appWhatIsIt.helpers({
	isLoading() {
		if (Template.instance().isLoading) {
			return Template.instance().isLoading.get();
		}

		return false;
	},
	hasError() {
		if (Template.instance().hasError) {
			return Template.instance().hasError.get();
		}

		return false;
	},
});

Template.appWhatIsIt.events({
	'click .js-enable'(e, t) {
		t.isLoading.set(true);

		Meteor.call('apps/go-enable', function _appsMightHaveBeenEnabled(error) {
			if (error) {
				t.hasError.set(true);
				t.isLoading.set(false);
				return;
			}

			window.Apps.load(true);

			FlowRouter.go('/admin/apps');
		});
	},
});
