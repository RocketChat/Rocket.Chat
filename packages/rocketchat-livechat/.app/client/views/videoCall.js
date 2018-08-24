/* globals LivechatVideoCall */

Template.videoCall.helpers({
	visible() {
		if (Template.instance().showToolbar.get()) {
			return 'visible';
		}
	}
});

Template.videoCall.events({
	'click .end-call'() {
		LivechatVideoCall.finish();
	},
	'click .video-overlay'(e, instance) {
		if (instance.timeout) {
			clearTimeout(instance.timeout);
		}
		instance.showToolbar.set(!instance.showToolbar.get());

		if (instance.showToolbar.get()) {
			instance.timeout = setTimeout(() => {
				instance.showToolbar.set(false);
			}, 3000);
		}
	}
});

Template.videoCall.onCreated(function() {
	this.timeout = null;
	this.showToolbar = new ReactiveVar(true);

	this.timeout = setTimeout(() => {
		this.showToolbar.set(false);
	}, 10000);
});
