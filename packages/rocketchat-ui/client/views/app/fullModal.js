let oldRoute = '';
const parent = document.querySelector('.main-content');

FlowRouter.route('/create-channel', {
	name: 'create-channel',

	triggersEnter: [function() {
		oldRoute = FlowRouter.current().oldRoute;
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

Template.fullModal.events({
	'click button'() {
		oldRoute ? history.back() : FlowRouter.go('home');
	}
});

Template.fullModal.onRendered(function() {
	$('.main-content').removeClass('rc-old');
});
