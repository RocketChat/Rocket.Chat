Template.forwardMessage.helpers({
	users() {
		return RocketChat.models.Users.find({
			// TODO #396
		});
	},
	channels() {
		return RocketChat.models.Subscriptions.find({
			// TODO #396
		});
	}
});

Template.forwardMessage.onCreated(function() {
	// TODO #396
});

Template.forwardMessage.events({
	// TODO #396
});

const parent = document.querySelector('.main-content');

FlowRouter.route('/forward-message', {
	name: 'forward-message',

	action() {
		if (parent) {
			Blaze.renderWithData(Template.fullModal, {template: 'forwardMessage'}, parent);
		} else {
			BlazeLayout.render('main', {center: 'fullModal', template: 'forwardMessage'});
		}
	},

	triggersExit: [function() {
		Blaze.remove(Blaze.getView(document.getElementsByClassName('full-modal')[0]));
		$('.main-content').addClass('rc-old');
	}]
});

