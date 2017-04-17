/* global FlowRouter, BlazeLayout */
FlowRouter.route('/snippet/:snippetId/:snippetName', {
	name: 'snippetView',
	action() {
		BlazeLayout.render('main', {center: 'snippetPage', flexTabBar: null });
	},
	triggersEnter: [ function() {
		RocketChat.TabBar.hide();
	}],
	triggersExit: [
		function() {
			RocketChat.TabBar.show();
		}
	]
});
