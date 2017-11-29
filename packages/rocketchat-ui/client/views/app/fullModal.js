let oldRoute = '';
const parent = document.querySelector('.main-content');
let removeModal = false;

FlowRouter.route('/create-channel', {
	name: 'create-channel',

	triggersEnter: [function() {
		oldRoute = FlowRouter.current().oldRoute;

		if (oldRoute.name === 'forward-message') {
			oldRoute = null;
		}
	}],

	action() {
		if (parent) {
			Blaze.renderWithData(Template.fullModal, {template: 'createChannel'}, parent);
		} else {
			BlazeLayout.render('main', {center: 'fullModal', template: 'createChannel'});
		}
	},

	triggersExit: [function() {
		Blaze.remove(Blaze.getView(document.getElementsByClassName('full-modal')[0]));
		$('.main-content').addClass('rc-old');
	}]
});

FlowRouter.route('/forward-message', {
	name: 'forward-message',

	triggersEnter: [function() {
		oldRoute = FlowRouter.current().oldRoute;
	}],

	action() {
		if (parent) {
			Blaze.renderWithData(Template.fullModal, {template: 'forwardMessage'}, parent);
		} else {
			BlazeLayout.render('main', {center: 'fullModal', template: 'forwardMessage'});
		}
	},

	triggersExit: [function() {
		if (removeModal) {
			Blaze.remove(Blaze.getView(document.getElementsByClassName('full-modal')[0]));
		}

		$('.main-content').addClass('rc-old');
	}]
});

Template.fullModal.events({
	'click button'() {
		removeModal = true;

		oldRoute ? history.back() : FlowRouter.go('home');
	}
});

Template.fullModal.onCreated(function() {
	removeModal = false;
});

Template.fullModal.onRendered(function() {
	$('.main-content').removeClass('rc-old');
});
