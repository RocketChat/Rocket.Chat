FlowRouter.route('/admin/custom-emoji', {
	name: 'custom-emoji',
	subscriptions(/*params, queryParams*/) {
		this.register('CustomEmoji', Meteor.subscribe('CustomEmoji'));
	},
	action(/*params*/) {
		RocketChat.TabBar.showGroup('adminEmoji');
		BlazeLayout.render('main', {center: 'adminEmoji'});
	}
});
