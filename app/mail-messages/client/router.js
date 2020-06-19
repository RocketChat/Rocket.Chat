import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/mailer/unsubscribe/:_id/:createdAt', {
	name: 'mailer-unsubscribe',
	async action(params) {
		await import('./views');
		Meteor.call('Mailer:unsubscribe', params._id, params.createdAt);
		return BlazeLayout.render('mailerUnsubscribe');
	},
});
