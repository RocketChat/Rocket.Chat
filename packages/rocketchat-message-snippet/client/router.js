/* global FlowRouter, BlazeLayout */
FlowRouter.route('/snippet/:snippetId/:snippetName', {
	name: 'snippetView',
	action: function() {
		BlazeLayout.render('main', {center: 'snippetPage', flexTabBar: null });
	},
	triggersEnter: [ function() {
		RocketChat.TabBar.closeFlex();
		RocketChat.TabBar.hide();
	}],
	triggersExit: [
		function() {
			RocketChat.TabBar.show();
		}
	]
});
