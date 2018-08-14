import { FlowRouter } from 'meteor/kadira:flow-router';

FlowRouter.route('/create-thread', {
	name: 'create-thread',

	action() {
		return BlazeLayout.render('main', {center: 'CreateThread'});
	},
	triggersExit: [function() {
		$('.main-content').addClass('rc-old');
	}]
});
