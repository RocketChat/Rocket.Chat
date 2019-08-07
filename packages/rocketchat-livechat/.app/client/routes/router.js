import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import visitor from '../../imports/client/visitor';

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
