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

Template.rocketlets.events({
	'click .manage'() {
		const rl = this;

		if (rl && rl.id) {
			FlowRouter.go(`/admin/rocketlets/${ rl.id }`);
		} else {
			// show an error ? I don't think this should ever happen
		}
	},

	'click .install'() {
		FlowRouter.go('/admin/rocketlet/install');
	}
});
