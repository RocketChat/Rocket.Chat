import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/mailer', {
	name: 'mailer',
	action() {
		return BlazeLayout.render('main', {
			center: 'mailer',
		});
	},
});

FlowRouter.route('/mailer/unsubscribe/:_id/:createdAt', {
	name: 'mailer-unsubscribe',
	action(params) {
		Meteor.call('Mailer:unsubscribe', params._id, params.createdAt);
		return BlazeLayout.render('mailerUnsubscribe');
	},
});
