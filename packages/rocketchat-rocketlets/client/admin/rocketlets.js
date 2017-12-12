import Masonry from 'masonry-layout';

Template.rocketlets.onCreated(function() {
	const instance = this;
	this.ready = new ReactiveVar(false);
	this.rocketlets = new ReactiveVar([]);

	RocketChat.API.get('rocketlets').then((result) => {
		instance.rocketlets.set(result.rocketlets);
		instance.ready.set(true);
	});

	Tracker.autorun(() => {
		if (this.ready.get() === true) {
			console.log('render');
			const grid = new Masonry('.rc-discovery-wrap', {
				itemSelector: '.rc-discovery__item',
				columnWidth: 350
			});
		}
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
