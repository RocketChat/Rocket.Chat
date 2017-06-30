FlowRouter.route('/admin/emoji-custom', {
	name: 'emoji-custom',
	subscriptions(/*params, queryParams*/) {
		this.register('EmojiCustom', Meteor.subscribe('EmojiCustom'));
	},
	action(/*params*/) {
		BlazeLayout.render('main', {center: 'adminEmoji'});
	}
});
