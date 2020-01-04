import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/admin/emoji-custom', {
	name: 'emoji-custom',
	async action(/* params*/) {
		await import('./views');
		BlazeLayout.render('main', { center: 'adminEmoji' });
	},
});
