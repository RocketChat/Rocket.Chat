import visitor from '../../imports/client/visitor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

BlazeLayout.setRoot('body');

FlowRouter.route('/livechat', {
	name: 'index',
	triggersEnter: [
		() => visitor.register(),
	],
	action() {
		BlazeLayout.render('main', { center: 'livechatWindow' });
	},
});
