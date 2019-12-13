import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/admin/invites', {
	name: 'invites',
	async action(/* params */) {
		await import('./adminInvites');
		BlazeLayout.render('main', { center: 'adminInvites' });
	},
});
