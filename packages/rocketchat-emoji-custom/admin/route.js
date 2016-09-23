FlowRouter.route('/admin/emoji-custom', {
	name: 'emoji-custom',
	subscriptions(/*params, queryParams*/) {
		this.register('EmojiCustom', Meteor.subscribe('EmojiCustom'));
	},
	action(/*params*/) {
		RocketChat.TabBar.showGroup('adminEmoji');
		BlazeLayout.render('main', {center: 'adminEmoji'});
	}
});
