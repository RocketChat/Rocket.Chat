import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/admin/emoji-custom', {
	name: 'emoji-custom',
	subscriptions(/* params, queryParams*/) {
		this.register('EmojiCustom', Meteor.subscribe('EmojiCustom'));
	},
	action(/* params*/) {
		BlazeLayout.render('main', { center: 'adminEmoji' });
	},
});
