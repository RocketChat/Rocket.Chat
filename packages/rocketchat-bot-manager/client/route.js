import { FlowRouter } from 'meteor/kadira:flow-router' ;
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { t } from 'meteor/rocketchat:utils';

FlowRouter.route('/admin/bots', {
	name: 'admin-bots',
	action() {
		return BlazeLayout.render('main', {
			center: 'adminBots',
			pageTitle: t('Bots'),
		});
	},
});

FlowRouter.route('/admin/bots/:username', {
	name: 'admin-bots-username',
	action(params) {
		return BlazeLayout.render('main', {
			center: 'adminBotDetails',
			pageTitle: t('Bot_Details'),
			params,
		});
	},
});

FlowRouter.route('/admin/bots/:username/logs', {
	name: 'admin-bots-log',
	action(params) {
		return BlazeLayout.render('main', {
			center: 'adminBotLogs',
			pageTitle: t('Bot_Logs'),
			params,
		});
	},
});
