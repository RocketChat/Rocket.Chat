

import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/directory', {
	name: 'directory',

	async action() {
		await import('../../app/ui/client/views/app/directory');
		BlazeLayout.render('main', { center: 'directory' });
	},
	triggersExit: [
		function() {
			$('.main-content').addClass('rc-old');
		},
	],
});
