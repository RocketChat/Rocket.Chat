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
	this.message = FlowRouter.getParam('message');

});

Template.forwardMessage.events({
	// TODO #396
	// toastr.success(TAPi18n.__('Forwarded'));
});

const parent = document.querySelector('.main-content');

FlowRouter.route('/forward-message', {
	name: 'forward-message',

	action(params, queryParams) {
		console.log('Query Params:', queryParams);

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

