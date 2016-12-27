FlowRouter.route('/admin/custom-sounds', {
	name: 'custom-sounds',
	subscriptions(/*params, queryParams*/) {
		this.register('customSounds', Meteor.subscribe('customSounds'));
	},
	action(/*params*/) {
		RocketChat.TabBar.showGroup('adminSounds');
		BlazeLayout.render('main', {center: 'adminSounds'});
	}
});
