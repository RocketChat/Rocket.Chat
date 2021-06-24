import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/admin/oembed', {
	name: 'oembed',
	async action(/* params */) {
		await import('./views');
		BlazeLayout.render('main', { center: 'adminOembed' });
	},
});
