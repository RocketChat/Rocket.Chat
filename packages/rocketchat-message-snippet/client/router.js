import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { TabBar } from 'meteor/rocketchat:ui-utils';

FlowRouter.route('/snippet/:snippetId/:snippetName', {
	name: 'snippetView',
	action() {
		BlazeLayout.render('main', { center: 'snippetPage', flexTabBar: null });
	},
	triggersEnter: [function() {
		TabBar.hide();
	}],
	triggersExit: [
		function() {
			TabBar.show();
		},
	],
});
