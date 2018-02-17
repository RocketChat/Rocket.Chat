FlowRouter.route('/admin/custom-sounds', {
	name: 'custom-sounds',
	subscriptions(/*params, queryParams*/) {
		this.register('customSounds', Meteor.subscribe('customSounds'));
	},
	action(/*params*/) {
		BlazeLayout.render('main', {center: 'adminSounds'});
	}
});
