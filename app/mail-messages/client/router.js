import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import * as AppLayout from '../../../client/lib/appLayout';

FlowRouter.route('/mailer/unsubscribe/:_id/:createdAt', {
	name: 'mailer-unsubscribe',
	async action(params) {
		await import('./views');
		Meteor.call('Mailer:unsubscribe', params._id, params.createdAt);
		return AppLayout.render('mailerUnsubscribe');
	},
});
