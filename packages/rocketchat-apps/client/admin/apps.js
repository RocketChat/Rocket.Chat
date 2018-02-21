Template.apps.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(false);
	this.apps = new ReactiveVar([]);

	RocketChat.API.get('apps').then((result) => {
		instance.apps.set(result.apps);
		instance.ready.set(true);
	});
});

Template.apps.helpers({
	isReady() {
		if (Template.instance().ready != null) {
			return Template.instance().ready.get();
		}

		return false;
	},
	apps() {
		return Template.instance().apps.get();
	}
});

Template.apps.events({
	'click .manage'() {
		const rl = this;

		if (rl && rl.id) {
			FlowRouter.go(`/admin/apps/${ rl.id }`);
		} else {
			// show an error ? I don't think this should ever happen
		}
	},

	'click [data-button="install"]'() {
		FlowRouter.go('/admin/app/install');
	}
});
