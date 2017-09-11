Template.rocketlets.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(false);
	this.rocketlets = new ReactiveVar([]);

	RocketChat.API.get('rocketlets').then((result) => {
		instance.rocketlets.set(result.rocketlets);
	});
});

Template.rocketlets.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}

		return false;
	},
	rocketlets() {
		return Template.instance().rocketlets.get();
	}
});
