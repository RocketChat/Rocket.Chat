import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/admin/emoji-custom', {
	name: 'emoji-custom',
	action(/* params*/) {
		BlazeLayout.render('main', { center: 'adminEmoji' });
	},
});
